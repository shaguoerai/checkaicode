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

interface SemgrepApiOutput {
  results: SemgrepFinding[];
  errors: any[];
  scanTimeMs: number;
  exitCode?: number;
  stderr?: string;
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

/**
 * 从代码内容或文件名推断语言
 */
function detectLanguage(code: string, filename?: string): string {
  // 优先从文件名推断
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext) {
      const langByExt = Object.entries(LANG_EXT).find(([, e]) => e === `.${ext}`);
      if (langByExt) return langByExt[0];
    }
  }
  // 从代码内容推断
  if (code.includes("def ") || code.includes("import ") || code.includes("print(")) return "python";
  if (code.includes("package main") || code.includes("func ")) return "go";
  if (code.includes("public class ") || code.includes("import java.")) return "java";
  if (code.includes("interface ") && code.includes(": ")) return "typescript";
  if (code.includes("const ") || code.includes("let ") || code.includes("var ")) return "javascript";
  if (code.includes("function ") || code.includes("=>")) return "javascript";
  return "javascript"; // 默认
}

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

function cweReferenceUrl(cwe: string | undefined): string | undefined {
  const match = cwe?.match(/CWE-(\d+)/i);
  return match ? `https://cwe.mitre.org/data/definitions/${match[1]}.html` : undefined;
}

function parseSemgrepOutput(output: SemgrepApiOutput, tmpDir: string) {
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
      referenceUrl: cweReferenceUrl(r.extra?.metadata?.cwe?.[0]),
    };
  });

  return {
    issues,
    scanTimeMs: output.scanTimeMs,
    error: output.errors?.length
      ? output.errors.map((e: any) => e.message || String(e)).join("; ")
      : undefined,
  };
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
  // Local development may opt in to a machine-installed Semgrep CLI.
  // Production defaults to the Python Function because the Node runtime
  // cannot reliably execute the Python Semgrep package.
  if (process.env.SEMGREP_USE_LOCAL === "1") {
    try {
      execSync("which semgrep", { encoding: "utf-8", stdio: "pipe" });
      return runSemgrepLocal(code, language);
    } catch {
      // CLI not available, use HTTP API
    }
  }

  const baseUrl =
    process.env.SEMGREP_API_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL ? "https://checkaicode.com" : "http://localhost:3000");

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (process.env.SEMGREP_API_SECRET) {
    headers["x-semgrep-api-secret"] = process.env.SEMGREP_API_SECRET;
  }

  const detectedLang = language === "auto" || !language
    ? detectLanguage(code)
    : language;

  const res = await fetch(`${baseUrl}/api/semgrep`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      code,
      language: detectedLang,
      filename: "input",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    return { issues: [], scanTimeMs: 0, error: `Semgrep API error ${res.status}: ${text}` };
  }

  const output: SemgrepApiOutput = await res.json();

  // Use a dummy tmpDir for path replacement (Python Function already replaced tmp_dir with "input")
  return parseSemgrepOutput(output, "input");
}

// ── 14 套规则集，按语言动态加载 ──
const COMMON_RULESETS = [
  "p/default",
  "p/owasp-top-ten",
  "p/command-injection",
  "p/jwt",
  "p/secrets",
  "p/supply-chain",
];

const LANGUAGE_RULESETS: Record<string, string[]> = {
  javascript: ["p/javascript", "p/react", "p/nodejs"],
  typescript: ["p/typescript", "p/react", "p/nodejs"],
  python: ["p/python"],
  go: ["p/golang"],
  java: ["p/java"],
};

const EXCLUDED_RULESETS = new Set([
  "p/ssrf",
  "p/r2c-security-audit",
  "p/sql-injection",
  "p/xss",
]);

function rulesetsFor(language: string): string[] {
  const lang = language.toLowerCase();
  const rulesets = [...COMMON_RULESETS, ...(LANGUAGE_RULESETS[lang] || [])];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const r of rulesets) {
    if (!seen.has(r) && !EXCLUDED_RULESETS.has(r)) {
      seen.add(r);
      result.push(r);
    }
  }
  return result;
}

async function runSemgrepLocal(code: string, language: string): Promise<{
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

  const activeRulesets = rulesetsFor(language);

  try {
    fs.writeFileSync(srcFile, code, "utf-8");

    const startTime = Date.now();
    const cmdParts = ["semgrep", "--json", "--quiet"];
    for (const rs of activeRulesets) {
      cmdParts.push("--config", rs);
    }
    cmdParts.push(srcFile);

    const stdout = execSync(cmdParts.join(" "), {
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
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
        referenceUrl: cweReferenceUrl(r.extra?.metadata?.cwe?.[0]),
      };
    });

    return { issues, scanTimeMs };
  } catch (err: any) {
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
            referenceUrl: cweReferenceUrl(r.extra?.metadata?.cwe?.[0]),
          };
        });
        return { issues, scanTimeMs };
      } catch {
        return { issues: [], scanTimeMs: 0, error: err.message };
      }
    }
    return { issues: [], scanTimeMs: 0, error: err.message };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
