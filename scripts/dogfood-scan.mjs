import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = mkdtempSync(path.join(tmpdir(), "checkaicode-dogfood-"));

const rawArgs = process.argv.slice(2);
const jsonOutput = rawArgs.includes("--json");
const skipRuleDefinitions = rawArgs.includes("--skip-rule-definitions");
const skipFixtures = rawArgs.includes("--skip-fixtures");
const scanAll = rawArgs.includes("--all");
const maxIssuesArgIndex = rawArgs.indexOf("--max-issues");
const maxIssues =
  maxIssuesArgIndex >= 0 && rawArgs[maxIssuesArgIndex + 1]
    ? Number(rawArgs[maxIssuesArgIndex + 1])
    : Number.POSITIVE_INFINITY;
const inputFiles = rawArgs.filter((arg, index) => {
  if (arg === "--json") return false;
  if (arg === "--skip-rule-definitions") return false;
  if (arg === "--skip-fixtures") return false;
  if (arg === "--all") return false;
  if (arg === "--max-issues") return false;
  if (rawArgs[index - 1] === "--max-issues") return false;
  return true;
});

const defaultFiles = [
  "src/app/api/analyze/route.ts",
  "src/app/feedback/soft-launch/page.tsx",
  "scripts/ops-report.mjs",
  "scanner.py",
  "/root/projects/social-monitor/local_socks_forwarder.py",
  "/root/projects/yuseries-council/council_brainstorm.py",
];

const languageByExt = new Map([
  [".js", "javascript"],
  [".mjs", "javascript"],
  [".jsx", "javascript"],
  [".ts", "typescript"],
  [".tsx", "typescript"],
  [".py", "python"],
]);

const excludedDirs = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const excludedFiles = new Set(["next-env.d.ts"]);

function compileRuleEngine() {
  const sourcePath = path.join(root, "src", "lib", "rules", "rule-engine.ts");
  const source = readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });

  const diagnostics = output.diagnostics ?? [];
  const blockingDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (blockingDiagnostics.length) {
    const message = ts.formatDiagnosticsWithColorAndContext(blockingDiagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    });
    throw new Error(message);
  }

  const rulesDir = path.join(outDir, "rules");
  mkdirSync(rulesDir, { recursive: true });
  writeFileSync(path.join(rulesDir, "rule-engine.cjs"), output.outputText);
  writeFileSync(path.join(outDir, "review-types.js"), "");
}

async function loadRuleEngine() {
  const modulePath = path.join(outDir, "rules", "rule-engine.cjs");
  return import(`file://${modulePath}`);
}

function resolveInput(file) {
  return path.isAbsolute(file) ? file : path.join(root, file);
}

function detectLanguage(file) {
  return languageByExt.get(path.extname(file).toLowerCase()) ?? "auto";
}

function toRelativeDisplay(file) {
  return file.startsWith(root) ? path.relative(root, file) : file;
}

function isRuleDefinitionFile(file) {
  const normalized = file.replace(/\\/g, "/");
  return (
    normalized.endsWith("/src/lib/rules/rule-engine.ts") ||
    normalized.endsWith("/scanner.py")
  );
}

function isFixtureFile(file) {
  const normalized = file.replace(/\\/g, "/");
  return normalized.endsWith("/test-rules.ts");
}

function listCodeFiles(dir = root) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      files.push(...listCodeFiles(filePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (excludedFiles.has(entry.name)) continue;
    if (!languageByExt.has(path.extname(entry.name).toLowerCase())) continue;
    if (statSync(filePath).size === 0) continue;
    files.push(filePath);
  }

  return files.sort((a, b) => toRelativeDisplay(a).localeCompare(toRelativeDisplay(b)));
}

try {
  compileRuleEngine();
  const { analyzeCode } = await loadRuleEngine();
  const selectedFiles = scanAll ? listCodeFiles() : inputFiles.length ? inputFiles : defaultFiles;
  const targets = selectedFiles
    .map(resolveInput)
    .filter((filePath) => !skipRuleDefinitions || !isRuleDefinitionFile(filePath))
    .filter((filePath) => !skipFixtures || !isFixtureFile(filePath));
  const results = [];

  for (const filePath of targets) {
    const code = readFileSync(filePath, "utf8");
    const language = detectLanguage(filePath);
    const result = analyzeCode(code, language);
    results.push({
      file: toRelativeDisplay(filePath),
      language,
      lines: code.split("\n").length,
      score: result.score,
      summary: result.summary,
      issues: result.issues,
    });
  }

  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const summary = {
    filesScanned: results.length,
    totalIssues,
    critical: results.reduce(
      (sum, result) => sum + result.issues.filter((issue) => issue.severity === "critical").length,
      0
    ),
    warning: results.reduce(
      (sum, result) => sum + result.issues.filter((issue) => issue.severity === "warning").length,
      0
    ),
    info: results.reduce(
      (sum, result) => sum + result.issues.filter((issue) => issue.severity === "info").length,
      0
    ),
  };

  if (jsonOutput) {
    console.log(JSON.stringify({ summary, results }, null, 2));
    process.exit(0);
  }

  for (const result of results) {
    console.log("");
    console.log(`${result.file} (${result.language}, ${result.lines} lines)`);
    console.log(`Score: ${result.score}`);
    console.log(result.summary);

    if (!result.issues.length) {
      console.log("- No issues found by static rule engine.");
      continue;
    }

    for (const issue of result.issues.slice(0, maxIssues)) {
      console.log(
        `- [${issue.severity}] line ${issue.line}: ${issue.title} (${issue.id})`
      );
      if (issue.code_snippet) console.log(`  snippet: ${issue.code_snippet}`);
      if (issue.fix_suggestion) console.log(`  suggestion: ${issue.fix_suggestion}`);
    }
    if (result.issues.length > maxIssues) {
      console.log(`- ... ${result.issues.length - maxIssues} more issue(s) omitted`);
    }
  }

  console.log("");
  console.log(`Dogfood summary: ${summary.filesScanned} files scanned, ${summary.totalIssues} static-rule issues found.`);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
