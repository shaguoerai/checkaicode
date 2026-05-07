import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { analyzeCode as modalAnalyze } from "@/lib/analyzer";
import { analyzeCode as ruleEngineAnalyze } from "@/lib/rules/rule-engine";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

interface FileInput {
  filename: string;
  code: string;
  language: string;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // 1. 额度检查（已登录按用户，未登录按 IP）
  const usage = await checkUsageLimit(userId, req);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Upgrade to Pro for unlimited reviews." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const files: FileInput[] = body.files ?? [{ filename: body.filename || "input", code: body.code, language: body.language || "auto" }];

  if (!files.length || !files.some(f => f.code?.trim())) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const totalLines = files.reduce((sum, f) => sum + (f.code?.split("\n").length || 0), 0);
  const MAX_LINES = 500;
  if (totalLines > MAX_LINES && !usage.isPro) {
    return NextResponse.json(
      {
        error: `Total ${totalLines} lines across ${files.length} file(s). Free scan supports up to ${MAX_LINES} lines. Upgrade to Pro for unlimited file size.`,
        lines: totalLines,
        maxLines: MAX_LINES,
        overBy: totalLines - MAX_LINES,
      },
      { status: 400 }
    );
  }

  try {
    const allIssues: any[] = [];
    let totalScore = 0;
    const fileResults: { filename: string; score: number; issues: any[]; summary: string }[] = [];

    for (const file of files) {
      // 2. Modal Scanner 远程扫描
      const modalResult = await modalAnalyze(file.code, file.language || "auto");

      // 3. 本地规则引擎扫描
      const ruleResult = ruleEngineAnalyze(file.code, file.language || "auto");

      // 4. 合并结果
      const mergedIssues = [
        ...modalResult.issues,
        ...ruleResult.issues.map((ri: any) => ({
          type: mapRuleTypeToModal(ri.type),
          severity: ri.severity,
          file: file.filename || "input",
          line: ri.line,
          message: ri.title,
          ruleId: ri.id,
          endLine: ri.line,
          fixSuggestion: ri.fix_suggestion,
          fixCode: ri.fix_code,
          referenceUrl: ri.reference_url,
          codeSnippet: ri.code_snippet,
        })),
      ];

      // 去重
      const seen = new Set<string>();
      const deduped = mergedIssues.filter((issue) => {
        const key = `${issue.line}:${issue.ruleId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // severity 排序
      const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      // score
      let score = 100;
      for (const issue of deduped) {
        if (issue.severity === "critical") score -= 15;
        else if (issue.severity === "warning") score -= 5;
        else score -= 2;
      }
      score = Math.max(0, Math.min(100, score));
      totalScore += score;

      const critCount = deduped.filter((i: any) => i.severity === "critical").length;
      const warnCount = deduped.filter((i: any) => i.severity === "warning").length;
      const infoCount = deduped.filter((i: any) => i.severity === "info").length;

      const summary = deduped.length === 0
        ? "No issues found."
        : `Found ${deduped.length} issue${deduped.length > 1 ? "s" : ""} (${critCount} critical, ${warnCount} warning${critCount + warnCount > 0 ? ", " + infoCount + " info" : ""}).`;

      fileResults.push({ filename: file.filename || "input", score, issues: deduped, summary });
      allIssues.push(...deduped);
    }

    const overallScore = Math.round(totalScore / files.length);
    const totalIssues = allIssues.length;
    const overallSummary = totalIssues === 0
      ? "No issues found across all files."
      : `Found ${totalIssues} issue${totalIssues > 1 ? "s" : ""} across ${files.length} file${files.length > 1 ? "s" : ""}.`;

    // 5. 记录使用次数 + 保存 Review
    await incrementUsage(userId, req);
    if (userId && files.length === 1) {
      await prisma.review.create({
        data: {
          userId,
          code: files[0].code.slice(0, 10000),
          language: files[0].language || "auto",
          filename: files[0].filename || null,
          score: overallScore,
          issues: allIssues as any,
          summary: overallSummary,
        },
      });
    }

    return NextResponse.json({
      summary: overallSummary,
      score: overallScore,
      issues: allIssues,
      fileResults,
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
