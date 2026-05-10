import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { analyzeCode as ruleEngineAnalyze } from "@/lib/rules/rule-engine";
import { runSemgrep } from "@/lib/semgrep";
import { runLLMAnalysis, LLMScanMode } from "@/lib/llm-analysis";
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
  const scanMode: LLMScanMode = body.scanMode === "deep" ? "deep" : "standard";
  const privacyMode: boolean = body.privacyMode === true;

  if (!files.length || !files.some(f => f.code?.trim())) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const totalLines = files.reduce((sum, f) => sum + (f.code?.split("\n").length || 0), 0);
  const MAX_LINES = 3000;
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
      // 2. 本地规则引擎扫描
      const ruleResult = ruleEngineAnalyze(file.code, file.language || "auto");

      // 3. Semgrep 社区规则集扫描
      const semgrepResult = await runSemgrep(file.code, file.language || "auto");

      // 4. 合并结果（rule-engine + Semgrep）
      const ruleIssues = ruleResult.issues.map((ri: any) => ({
        type: ri.type === "security" ? "security" : "quality",
        severity: ri.severity,
        file: file.filename || "input",
        line: ri.line,
        endLine: ri.line,
        message: ri.title,
        ruleId: ri.id,
        fixSuggestion: ri.fix_suggestion,
        fixCode: ri.fix_code,
        referenceUrl: ri.reference_url,
        codeSnippet: ri.code_snippet,
      }));

      const mergedIssues = [...ruleIssues, ...semgrepResult.issues];

      // 去重（按行号+规则ID去重，rule-engine和Semgrep可能检出同一问题）
      const seen = new Set<string>();
      const deduped = mergedIssues.filter((issue: any) => {
        const key = `${issue.line}:${issue.ruleId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // severity 排序
      const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
      deduped.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      // 5. Pro 用户 + 非隐私模式 → LLM 深度分析（只对有问题代码生成修复建议）
      let llmIssues: any[] = [];
      if (usage.isPro && !privacyMode && deduped.length > 0) {
        try {
          const llmResult = await runLLMAnalysis({
            code: file.code,
            language: file.language || "auto",
            issues: deduped,
            mode: scanMode,
          });
          llmIssues = llmResult.issues;
        } catch (llmErr) {
          console.error("LLM analysis error (non-blocking):", llmErr);
          // LLM 故障不阻断整体扫描，静默降级为规则引擎结果
        }
      }

      // 合并 LLM 结果（LLM 只补充/增强，不独立判断）
      const finalIssues = [...deduped, ...llmIssues];
      // 二次去重：LLM 可能对同一行给出建议，保留 LLM 增强版
      const finalSeen = new Set<string>();
      const finalDeduped = finalIssues.filter((issue: any) => {
        const key = `${issue.line}:${issue.ruleId || issue.message?.slice(0, 30)}`;
        if (finalSeen.has(key)) return false;
        finalSeen.add(key);
        return true;
      });

      // score
      let score = 100;
      for (const issue of finalDeduped) {
        if (issue.severity === "critical") score -= 15;
        else if (issue.severity === "warning") score -= 5;
        else score -= 2;
      }
      score = Math.max(0, Math.min(100, score));
      totalScore += score;

      const critCount = finalDeduped.filter((i: any) => i.severity === "critical").length;
      const warnCount = finalDeduped.filter((i: any) => i.severity === "warning").length;
      const infoCount = finalDeduped.filter((i: any) => i.severity === "info").length;

      const summary = finalDeduped.length === 0
        ? "No issues found."
        : `Found ${finalDeduped.length} issue${finalDeduped.length > 1 ? "s" : ""} (${critCount} critical, ${warnCount} warning${critCount + warnCount > 0 ? ", " + infoCount + " info" : ""}).`;

      fileResults.push({ filename: file.filename || "input", score, issues: finalDeduped, summary });
      allIssues.push(...finalDeduped);
    }

    const overallScore = Math.round(totalScore / files.length);
    const totalIssues = allIssues.length;
    const overallSummary = totalIssues === 0
      ? "No issues found across all files."
      : `Found ${totalIssues} issue${totalIssues > 1 ? "s" : ""} across ${files.length} file${files.length > 1 ? "s" : ""}.`;

    // 6. 记录使用次数 + 保存 Review
    // Pro Deep 模式消耗 5× 配额
    const quotaMultiplier = (usage.isPro && scanMode === "deep" && !privacyMode) ? 5 : 1;
    for (let i = 0; i < quotaMultiplier; i++) {
      await incrementUsage(userId, req);
    }

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
      remaining: usage.remaining > 0 ? usage.remaining - quotaMultiplier : 0,
      isPro: usage.isPro,
      scanMode: usage.isPro ? scanMode : undefined,
      privacyMode: usage.isPro ? privacyMode : undefined,
      llmEnabled: usage.isPro && !privacyMode,
    });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
