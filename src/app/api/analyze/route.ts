import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { trackPaywallEvent } from "@/lib/paywall-tracking";
import { analyzeCode as ruleEngineAnalyze } from "@/lib/rules/rule-engine";
import { runSemgrep } from "@/lib/semgrep";
import { hasLLMProvider, runLLMAnalysis, LLMScanMode } from "@/lib/llm-analysis";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

interface FileInput {
  filename: string;
  code: string;
  language: string;
}

const staleAuthCookies = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
];

function clearStaleAuthCookies(response: NextResponse) {
  for (const name of staleAuthCookies) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}

async function getOptionalSession() {
  try {
    return { session: await auth(), authFailed: false };
  } catch (error) {
    console.error("Auth session read failed; continuing as anonymous:", error);
    return { session: null, authFailed: true };
  }
}

export async function POST(req: Request) {
  const { session, authFailed } = await getOptionalSession();
  const userId = session?.user?.id ?? null;
  const json = (body: unknown, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    return authFailed ? clearStaleAuthCookies(response) : response;
  };

  try {
    // 1. 额度检查（已登录按用户，未登录按 IP）
    const usage = await checkUsageLimit(userId, req);
    if (!usage.allowed) {
      // 触墙埋点：记录免费用户额度用完
      const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                       req.headers.get("x-real-ip")?.trim() ||
                       "unknown";
      await trackPaywallEvent({
        userId,
        ip: clientIP,
        eventType: "hit",
        metadata: { remaining: usage.remaining, isPro: usage.isPro },
      });

      return json(
        { error: "Daily limit reached. Upgrade to Pro for unlimited reviews." },
        { status: 429 }
      );
    }

  const body = await req.json();
  const files: FileInput[] = body.files ?? [{ filename: body.filename || "input", code: body.code, language: body.language || "auto" }];
  const scanMode: LLMScanMode = body.scanMode === "deep" ? "deep" : "standard";
  const privacyMode: boolean = body.privacyMode === true;
  const paywallEvent: string | undefined = body.paywallEvent; // 'upgrade' | 'leave' | 'return_next_day'

  // 前端上报的触墙后续事件（upgrade/leave/return_next_day）
  if (paywallEvent && ["upgrade", "leave", "return_next_day"].includes(paywallEvent)) {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip")?.trim() ||
                     "unknown";
    await trackPaywallEvent({
      userId,
      ip: clientIP,
      eventType: paywallEvent as "upgrade" | "leave" | "return_next_day",
      metadata: { source: "client_report" },
    });
    return json({ ok: true });
  }

  if (!files.length || !files.some(f => f.code?.trim())) {
    return json({ error: "Code required" }, { status: 400 });
  }

  const totalLines = files.reduce((sum, f) => sum + (f.code?.split("\n").length || 0), 0);
  const MAX_LINES = 3000;
  if (totalLines > MAX_LINES && !usage.isPro) {
    return json(
      {
        error: `Total ${totalLines} lines across ${files.length} file(s). Free scan supports up to ${MAX_LINES} lines. Upgrade to Pro for unlimited file size.`,
        lines: totalLines,
        maxLines: MAX_LINES,
        overBy: totalLines - MAX_LINES,
      },
      { status: 400 }
    );
  }

interface ScanIssue {
  type: string;
  severity: string;
  file: string;
  line: number;
  endLine?: number;
  message: string;
  ruleId: string;
  fixSuggestion?: string;
  fixCode?: string;
  referenceUrl?: string;
  codeSnippet?: string;
  aiGenerated?: boolean;
  source?: "static" | "llm";
}

    const allIssues: ScanIssue[] = [];
    let totalScore = 0;
    let llmAttempted = false;
    let llmGenerated = 0;
    let llmModelUsed: string | undefined;
    let llmError: string | undefined;
    const fileResults: { filename: string; score: number; issues: ScanIssue[]; summary: string }[] = [];

    for (const file of files) {
      // 2. 本地规则引擎扫描
      const ruleResult = ruleEngineAnalyze(file.code, file.language || "auto");

      // 3. Semgrep 社区规则集扫描
      const semgrepResult = await runSemgrep(file.code, file.language || "auto");

      // 4. 合并结果（rule-engine + Semgrep）
      const ruleIssues = ruleResult.issues.map((ri) => ({
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
        source: "static" as const,
      }));

      const semgrepIssues = semgrepResult.issues.map((issue) => ({
        ...issue,
        source: "static" as const,
      }));

      const mergedIssues = [...ruleIssues, ...semgrepIssues];

      // 去重（按行号+规则ID去重，rule-engine和Semgrep可能检出同一问题）
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

      // 5. Pro 用户 + 非隐私模式 → LLM 深度分析（只对有问题代码生成修复建议）
      let llmIssues: ScanIssue[] = [];
      if (usage.isPro && !privacyMode && hasLLMProvider() && deduped.length > 0) {
        llmAttempted = true;
        try {
          const llmResult = await runLLMAnalysis({
            code: file.code,
            language: file.language || "auto",
            issues: deduped,
            mode: scanMode,
          });
          llmIssues = llmResult.issues;
          llmGenerated += llmResult.issues.length;
          if (llmResult.modelUsed) llmModelUsed = llmResult.modelUsed;
          if (llmResult.error) llmError = llmResult.error;
        } catch (llmErr) {
          console.error("LLM analysis error (non-blocking):", llmErr);
          llmError = llmErr instanceof Error ? llmErr.message : String(llmErr);
          // LLM 故障不阻断整体扫描，静默降级为规则引擎结果
        }
      }

      // 合并 LLM 结果：AI 增强覆盖对应静态问题，避免把同一问题显示两遍。
      const finalDeduped = [...deduped];
      for (const llmIssue of llmIssues) {
        let targetIndex = finalDeduped.findIndex(
          (issue) => issue.line === llmIssue.line && issue.ruleId === llmIssue.ruleId
        );
        if (targetIndex === -1) {
          targetIndex = finalDeduped.findIndex(
            (issue) => issue.line === llmIssue.line && issue.source !== "llm"
          );
        }

        if (targetIndex >= 0) {
          finalDeduped[targetIndex] = {
            ...finalDeduped[targetIndex],
            severity: llmIssue.severity || finalDeduped[targetIndex].severity,
            message: llmIssue.message || finalDeduped[targetIndex].message,
            fixSuggestion: llmIssue.fixSuggestion || finalDeduped[targetIndex].fixSuggestion,
            fixCode: llmIssue.fixCode || finalDeduped[targetIndex].fixCode,
            aiGenerated: true,
            source: "llm",
          };
        } else {
          finalDeduped.push(llmIssue);
        }
      }

      // score
      let score = 100;
      for (const issue of finalDeduped) {
        if (issue.severity === "critical") score -= 15;
        else if (issue.severity === "warning") score -= 5;
        else score -= 2;
      }
      score = Math.max(0, Math.min(100, score));
      totalScore += score;

      const critCount = finalDeduped.filter((i) => i.severity === "critical").length;
      const warnCount = finalDeduped.filter((i) => i.severity === "warning").length;
      const infoCount = finalDeduped.filter((i) => i.severity === "info").length;

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
          issues: allIssues as unknown as Record<string, unknown>[],
          summary: overallSummary,
        },
      });
    }

    return json({
      summary: overallSummary,
      score: overallScore,
      issues: allIssues,
      fileResults,
      remaining: usage.remaining > 0 ? usage.remaining - quotaMultiplier : 0,
      isPro: usage.isPro,
      scanMode: usage.isPro ? scanMode : undefined,
      privacyMode: usage.isPro ? privacyMode : undefined,
      llmEnabled: usage.isPro && !privacyMode && hasLLMProvider(),
      llmStatus: usage.isPro
        ? {
            enabled: !privacyMode && hasLLMProvider(),
            attempted: llmAttempted,
            generated: llmGenerated,
            model: llmModelUsed,
            error: llmError,
            reason: privacyMode
              ? "privacy_mode"
              : !hasLLMProvider()
                ? "no_provider"
                : allIssues.length === 0
                  ? "no_static_issues"
                  : llmAttempted && llmGenerated === 0
                    ? "fallback_static"
                    : llmGenerated > 0
                      ? "enhanced"
                      : "not_attempted",
          }
        : undefined,
      authRecovered: authFailed,
    });
  } catch (e: unknown) {
    console.error("Analyze error:", e);
    const errMsg = (e as Error)?.message || String(e);
    return json(
      { error: "Analysis failed", detail: errMsg },
      { status: 500 }
    );
  }
}
