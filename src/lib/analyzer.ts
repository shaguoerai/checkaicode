import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface Issue {
  type: "security" | "quality" | "dependency";
  severity: "critical" | "warning" | "info";
  file: string;
  line: number;
  column?: number;
  message: string;
  fix?: string;
  docsUrl?: string;
  ruleId: string;
  endLine?: number;
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

const EXTENSION_MAP: Record<string, string> = {
  python: ".py",
  javascript: ".js",
  typescript: ".ts",
  go: ".go",
  java: ".java",
};

function getExtension(language: string): string {
  const mapped = LANGUAGE_MAP[language.toLowerCase()] || language;
  return EXTENSION_MAP[mapped] || ".txt";
}

function mapSeverity(semgrepSeverity: string): "critical" | "warning" | "info" {
  switch (semgrepSeverity.toLowerCase()) {
    case "error":
      return "critical";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}

function mapType(checkId: string, metadata: any): "security" | "quality" | "dependency" {
  const cwe = metadata?.cwe || [];
  const owasp = metadata?.owasp || [];
  const securityKeywords = [
    "inject", "sql", "xss", "csrf", "command", "eval", "exec",
    "deserial", "traversal", "path", "ssrf", "lfi", "rfi",
    "crypto", "hash", "password", "secret", "token", "auth",
    "cwe", "owasp", "cve", "vuln",
  ];
  const idLower = checkId.toLowerCase();
  const hasSecurity = securityKeywords.some((k) => idLower.includes(k));
  if (hasSecurity || cwe.length > 0 || owasp.length > 0) {
    return "security";
  }
  return "quality";
}

export async function analyzeCode(code: string, language: string) {
  const mappedLang = LANGUAGE_MAP[language.toLowerCase()] || language;
  const ext = getExtension(mappedLang);
  const tmpFile = path.join("/tmp", `checkaicode_${Date.now()}${ext}`);

  fs.writeFileSync(tmpFile, code);

  let semgrepOutput: any = null;
  try {
    const cmd = `semgrep --config auto --json "${tmpFile}" 2>/dev/null`;
    const stdout = execSync(cmd, { encoding: "utf-8", timeout: 60000 });
    semgrepOutput = JSON.parse(stdout);
  } catch (e) {
    // Semgrep may exit non-zero when findings exist — still parse stdout
    try {
      const cmd = `semgrep --config auto --json "${tmpFile}" 2>/dev/null || true`;
      const stdout = execSync(cmd, { encoding: "utf-8", timeout: 60000 });
      semgrepOutput = JSON.parse(stdout);
    } catch (e2) {
      console.error("Semgrep failed:", e2);
    }
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }

  const issues: Issue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (semgrepOutput?.results) {
    for (const result of semgrepOutput.results) {
      const metadata = result.extra?.metadata || {};
      const fix = result.extra?.fix || undefined;
      const docsUrl =
        metadata?.references?.[0] ||
        metadata?.source ||
        metadata?.["semgrep.url"] ||
        undefined;

      const issue: Issue = {
        type: mapType(result.check_id, metadata),
        severity: mapSeverity(result.extra?.severity || "warning"),
        file: result.path || "input",
        line: result.start?.line || 1,
        column: result.start?.col,
        message: result.extra?.message || result.check_id,
        fix,
        docsUrl,
        ruleId: result.check_id,
        endLine: result.end?.line,
      };

      issues.push(issue);

      if (issue.severity === "critical") {
        score -= 15;
      } else if (issue.severity === "warning") {
        score -= 5;
      } else {
        score -= 2;
      }

      if (fix) {
        suggestions.push(`[${result.check_id}] ${fix}`);
      }
    }
  }

  score = Math.max(0, Math.min(100, score));

  const summary = issues.length === 0
    ? "No issues found by Semgrep."
    : `Found ${issues.length} issue${issues.length > 1 ? "s" : ""} (${issues.filter((i) => i.severity === "critical").length} critical, ${issues.filter((i) => i.severity === "warning").length} warning, ${issues.filter((i) => i.severity === "info").length} info).`;

  return {
    summary,
    score,
    issues,
    suggestions,
  };
}
