import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { analyzeCode as modalAnalyze } from "@/lib/analyzer";
import { analyzeCode as ruleEngineAnalyze } from "@/lib/rules/rule-engine";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. 额度检查
  const usage = await checkUsageLimit(userId);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Upgrade to Pro for unlimited reviews." },
      { status: 429 }
    );
  }

  const { code, language, filename } = await req.json();
  if (!code || !code.trim()) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const lines = code.split("\n").length;
  const MAX_LINES = 500;
  if (lines > MAX_LINES && !usage.isPro) {
    return NextResponse.json(
      {
        error: `This file is ${lines} lines. Please keep it under ${MAX_LINES} lines (remove ${lines - MAX_LINES} lines) to try the free scan. Upgrade to Pro for unlimited file size.`,
        lines,
        maxLines: MAX_LINES,
        overBy: lines - MAX_LINES,
      },
      { status: 400 }
    );
  }

  try {
    // 2. Modal Scanner 远程扫描（保留线上已有逻辑）
    const modalResult = await modalAnalyze(code, language || "auto");

    // 3. 本地规则引擎扫描（新增）
    const ruleResult = ruleEngineAnalyze(code, language || "auto");

    // 4. 合并结果：Modal Scanner 的 Issue 优先，规则引擎补充
    const mergedIssues = [
      ...modalResult.issues,
      ...ruleResult.issues.map((ri) => ({
        type: mapRuleTypeToModal(ri.type),
        severity: ri.severity,
        file: "input",
        line: ri.line,
        message: ri.title,
        ruleId: ri.id,
        endLine: ri.line,
      })),
    ];

    // 去重：按 (line, ruleId) 去重
    const seen = new Set<string>();
    const deduped = mergedIssues.filter((issue) => {
      const key = `${issue.line}:${issue.ruleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    //  severity 排序
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // 重新计算 score
    let score = 100;
    for (const issue of deduped) {
      if (issue.severity === "critical") score -= 15;
      else if (issue.severity === "warning") score -= 5;
      else score -= 2;
    }
    score = Math.max(0, Math.min(100, score));

    const critCount = deduped.filter((i) => i.severity === "critical").length;
    const warnCount = deduped.filter((i) => i.severity === "warning").length;
    const infoCount = deduped.filter((i) => i.severity === "info").length;

    const summary =
      deduped.length === 0
        ? "No issues found."
        : `Found ${deduped.length} issue${deduped.length > 1 ? "s" : ""} (${critCount} critical, ${warnCount} warning${critCount + warnCount > 0 ? ", " + infoCount + " info" : ""}).`;

    // 5. 记录使用次数 + 保存 Review（新增）
    if (userId) {
      await incrementUsage(userId);
      await prisma.review.create({
        data: {
          userId,
          code: code.slice(0, 10000),
          language: language || "auto",
          filename: filename || null,
          score,
          issues: deduped as any,
          summary,
        },
      });
    }

    return NextResponse.json({
      summary,
      score,
      issues: deduped,
      remaining: usage.remaining > 0 ? usage.remaining - 1 : 0,
      isPro: usage.isPro,
    });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

function mapRuleTypeToModal(
  type: string
): "security" | "quality" | "dependency" {
  if (type === "security") return "security";
  if (type === "hallucinated_api" || type === "api_version_mismatch")
    return "quality";
  return "quality";
}
