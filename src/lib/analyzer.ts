/**
 * checkaicode 代码分析器
 * 通过 Modal 远程扫描服务执行 SAST + 密钥检测
 * Modal URL 从环境变量 MODAL_URL 读取（Vercel 配置）
 */

const MODAL_URL: string =
  process.env.MODAL_URL ||
  "https://shaguoer--code-scanner-fastapi-app.modal.run";

interface ModalFinding {
  rule_id: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  line_start: number;
  line_end: number;
  owasp?: string[];
}

export interface Issue {
  type: "security" | "quality" | "dependency";
  severity: "critical" | "warning" | "info";
  file: string;
  line: number;
  message: string;
  ruleId: string;
  endLine?: number;
  fixSuggestion?: string;
  fixCode?: string;
  codeSnippet?: string;
  referenceUrl?: string;
  aiGenerated?: boolean;
  source?: "static" | "llm";
}

const LANGUAGE_MAP: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  ts: "typescript",
  js: "javascript",
  go: "go",
  java: "java",
};

/**
 * 通过 Modal 远程扫描代码
 */
export async function analyzeCode(
  code: string,
  language: string
): Promise<{
  summary: string;
  score: number;
  issues: Issue[];
}> {
  const mappedLang = LANGUAGE_MAP[language.toLowerCase()] || "python";

  // 调用 Modal Scanner API
  const res = await fetch(`${MODAL_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language: mappedLang }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scanner API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: {
    findings: ModalFinding[];
    total: number;
    scan_time_ms: number;
    error?: string;
  } = await res.json();

  const issues: Issue[] = data.findings.map((f) => ({
    type: mapType(f.rule_id, f.owasp),
    severity: mapSeverity(f.severity),
    file: "input",
    line: f.line_start,
    message: f.message,
    ruleId: f.rule_id,
    endLine: f.line_end,
  }));

  // 计算评分
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 15;
    else if (issue.severity === "warning") score -= 5;
    else score -= 2;
  }
  score = Math.max(0, Math.min(100, score));

  // 摘要
  const critCount = issues.filter((i) => i.severity === "critical").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const summary =
    issues.length === 0
      ? "No issues found."
      : `Found ${issues.length} issue${issues.length > 1 ? "s" : ""} (${critCount} critical, ${warnCount} warning${critCount + warnCount > 0 ? ", " + infoCount + " info" : ""}). Scan time: ${data.scan_time_ms}ms.` +
        (data.error ? ` Note: ${data.error}` : "");

  return { summary, score, issues };
}

function mapSeverity(s: string): "critical" | "warning" | "info" {
  switch (s.toUpperCase()) {
    case "ERROR":
      return "critical";
    case "WARNING":
      return "warning";
    default:
      return "info";
  }
}

function mapType(
  ruleId: string,
  owasp?: string[]
): "security" | "quality" | "dependency" {
  const idLower = ruleId.toLowerCase();
  const securityKeywords = [
    "secret",
    "inject",
    "sql",
    "xss",
    "csrf",
    "command",
    "eval",
    "exec",
    "deserial",
    "ssrf",
    "crypto",
    "password",
    "token",
    "auth",
    "owasp",
    "cwe",
  ];
  if (owasp && owasp.length > 0) return "security";
  if (securityKeywords.some((k) => idLower.includes(k))) return "security";
  if (idLower.startsWith("secret-")) return "security";
  return "quality";
}
