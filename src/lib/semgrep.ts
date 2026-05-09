import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface SemgrepFinding {
  check_id: string;
  path: string;
  start: { line: number; col: number };
  end: { line: number; col: number };
  extra: {
    message: string;
    metadata?: {
      cwe?: string[];
      owasp?: string[];
      severity?: string;
      confidence?: string;
    };
    severity?: string;
    lines?: string;
    fix?: string;
  };
}

interface SemgrepOutput {
  results: SemgrepFinding[];
  errors: any[];
}

const LANG_EXT: Record<string, string> = {
  python: ".py",
  javascript: ".js",
  typescript: ".ts",
  java: ".java",
  go: ".go",
  ruby: ".rb",
  php: ".php",
  c: ".c",
  cpp: ".cpp",
  rust: ".rs",
  kotlin: ".kt",
  scala: ".scala",
  swift: ".swift",
  "c#": ".cs",
  csharp: ".cs",
};

// Semgrep 社区规则集 — 覆盖 OWASP + CWE + 各语言安全
const SEMGREP_RULESETS = [
  "p/default",
  "p/owasp-top-ten",
  "p/r2c-security-audit",
  "p/command-injection",
  "p/sql-injection",
  "p/xss",
  "p/ssrf",
  "p/python",
  "p/javascript",
  "p/typescript",
  "p/java",
  "p/go",
  "p/react",
  "p/flask",
];

function mapSemgrepSeverity(s: string | undefined): "critical" | "warning" | "info" {
  if (!s) return "warning";
  const sl = s.toLowerCase();
  if (sl === "error" || sl === "critical") return "critical";
  if (sl === "warning") return "warning";
  return "info";
}

function mapCheckIdToType(checkId: string): "security" | "quality" | "dependency" {
  const id = checkId.toLowerCase();
  if (
    id.includes("sql") ||
    id.includes("inject") ||
    id.includes("xss") ||
    id.includes("command") ||
    id.includes("eval") ||
    id.includes("exec") ||
    id.includes("secret") ||
    id.includes("key") ||
    id.includes("password") ||
    id.includes("csrf") ||
    id.includes("ssrf") ||
    id.includes("traversal") ||
    id.includes("deserialization") ||
    id.includes("crypto") ||
    id.includes("hash") ||
    id.includes("cipher") ||
    id.includes("cors") ||
    id.includes("debug")
  ) {
    return "security";
  }
  return "quality";
}

export async function runSemgrep(code: string, language: string): Promise<{
  issues: {
    type: "security" | "quality" | "dependency";
    severity: "critical" | "warning" | "info";
    file: string;
    line: number;
    endLine: number;
    message: string;
    ruleId: string;
    fixSuggestion?: string;
    fixCode?: string;
    codeSnippet?: string;
    referenceUrl?: string;
  }[];
  scanTimeMs: number;
  error?: string;
}> {
  const ext = LANG_EXT[language.toLowerCase()] || ".txt";
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "checkaicode-semgrep-"));
  const srcFile = path.join(tmpDir, `target${ext}`);

  try {
    fs.writeFileSync(srcFile, code, "utf-8");

    const startTime = Date.now();
    const cmdParts = ["semgrep", "--json", "--quiet"];
    for (const rs of SEMGREP_RULESETS) {
      cmdParts.push("--config", rs);
    }
    cmdParts.push(srcFile);

    const stdout = execSync(cmdParts.join(" "), {
      encoding: "utf-8",
      timeout: 30000, // 30s timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const scanTimeMs = Date.now() - startTime;
    const output: SemgrepOutput = JSON.parse(stdout);

    const issues = output.results.map((r) => {
      const severity = mapSemgrepSeverity(
        r.extra?.severity || r.extra?.metadata?.severity
      );
      const type = mapCheckIdToType(r.check_id);
      const fix = r.extra?.fix;

      return {
        type,
        severity,
        file: r.path.replace(tmpDir, "input"),
        line: r.start.line,
        endLine: r.end.line,
        message: r.extra.message,
        ruleId: r.check_id,
        fixSuggestion: fix
          ? `Suggested fix: ${fix.trim().slice(0, 200)}`
          : undefined,
        fixCode: fix || undefined,
        codeSnippet: r.extra?.lines?.trim() || undefined,
        referenceUrl: r.extra?.metadata?.cwe?.[0]
          ? `https://cwe.mitre.org/data/definitions/${r.extra.metadata.cwe[0].replace("CWE-", "")}.html`
          : undefined,
      };
    });

    return { issues, scanTimeMs };
  } catch (err: any) {
    // Semgrep returns exit code 1 when findings exist — that's normal
    if (err.status === 1 && err.stdout) {
      try {
        const output: SemgrepOutput = JSON.parse(err.stdout);
        const scanTimeMs = 0;
        const issues = output.results.map((r) => {
          const severity = mapSemgrepSeverity(
            r.extra?.severity || r.extra?.metadata?.severity
          );
          const type = mapCheckIdToType(r.check_id);
          const fix = r.extra?.fix;
          return {
            type,
            severity,
            file: r.path.replace(tmpDir, "input"),
            line: r.start.line,
            endLine: r.end.line,
            message: r.extra.message,
            ruleId: r.check_id,
            fixSuggestion: fix
              ? `Suggested fix: ${fix.trim().slice(0, 200)}`
              : undefined,
            fixCode: fix || undefined,
            codeSnippet: r.extra?.lines?.trim() || undefined,
            referenceUrl: r.extra?.metadata?.cwe?.[0]
              ? `https://cwe.mitre.org/data/definitions/${r.extra.metadata.cwe[0].replace("CWE-", "")}.html`
              : undefined,
          };
        });
        return { issues, scanTimeMs };
      } catch {
        return { issues: [], scanTimeMs: 0, error: err.message };
      }
    }
    return { issues: [], scanTimeMs: 0, error: err.message };
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
