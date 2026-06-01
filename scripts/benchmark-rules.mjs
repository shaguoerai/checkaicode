import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const samplesPath = path.join(root, "benchmarks", "known-bugs.json");
const outDir = mkdtempSync(path.join(tmpdir(), "checkaicode-benchmark-"));

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
  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
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

function loadRuleEngine() {
  const modulePath = path.join(outDir, "rules", "rule-engine.cjs");
  return import(`file://${modulePath}`);
}

function toIdSet(issues) {
  return new Set(issues.map((issue) => issue.id));
}

function runSample(analyzeCode, sample) {
  const result = analyzeCode(sample.code, sample.language);
  const ids = toIdSet(result.issues);
  const expectedPresent = sample.expectedPresent ?? [];
  const expectedAbsent = sample.expectedAbsent ?? [];
  const missing = expectedPresent.filter((id) => !ids.has(id));
  const unexpected = expectedAbsent.filter((id) => ids.has(id));
  const passed = missing.length === 0 && unexpected.length === 0;

  return {
    id: sample.id,
    title: sample.title,
    passed,
    missing,
    unexpected,
    found: [...ids],
  };
}

function printResults(results) {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const recallChecks = results.reduce((sum, r) => sum + (r.missing.length === 0 ? 1 : 0), 0);
  const falsePositiveChecks = results.reduce((sum, r) => sum + (r.unexpected.length === 0 ? 1 : 0), 0);

  console.log(`Rule benchmark: ${passed}/${total} samples passed`);
  console.log(`Expected-hit checks clear: ${recallChecks}/${total}`);
  console.log(`Expected-absent checks clear: ${falsePositiveChecks}/${total}`);
  console.log("");

  for (const result of results) {
    const marker = result.passed ? "PASS" : "FAIL";
    console.log(`${marker} ${result.id} - ${result.title}`);
    if (result.missing.length) console.log(`  missing: ${result.missing.join(", ")}`);
    if (result.unexpected.length) console.log(`  unexpected: ${result.unexpected.join(", ")}`);
    if (!result.passed) console.log(`  found: ${result.found.join(", ") || "(none)"}`);
  }

  if (passed !== total) {
    process.exitCode = 1;
  }
}

try {
  compileRuleEngine();
  const { analyzeCode } = await loadRuleEngine();
  const samples = JSON.parse(readFileSync(samplesPath, "utf8"));
  const results = samples.map((sample) => runSample(analyzeCode, sample));
  printResults(results);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
