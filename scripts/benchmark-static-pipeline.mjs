import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const samplesPath = path.join(root, "benchmarks", "known-bugs.json");
const reportDir =
  process.env.BENCHMARK_REPORT_DIR || path.join(tmpdir(), "checkaicode-benchmark-reports");
const semgrepUrl = process.env.BENCHMARK_COMPARE_URL || "https://checkaicode.com/api/semgrep";
const outDir = mkdtempSync(path.join(tmpdir(), "checkaicode-static-pipeline-"));

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

async function loadRuleEngine() {
  return import(`file://${path.join(outDir, "rules", "rule-engine.cjs")}`);
}

function classifySample(sample) {
  const ids = sample.expectedPresent ?? [];
  if (ids.some((id) => id.startsWith("SEC-"))) return "security";
  if (ids.some((id) => id.startsWith("DEPRECATED-") || id.startsWith("VERSION-"))) return "framework-version";
  if (ids.some((id) => id.startsWith("CROSSLANG-"))) return "ai-cross-language";
  if (ids.some((id) => id.startsWith("BUG-") || id.startsWith("SEM-"))) return "runtime-semantic";
  return "negative";
}

function postSemgrep(sample) {
  const payload = JSON.stringify({
    language: sample.language,
    filename: "input",
    code: sample.code,
  });

  try {
    const output = execFileSync(
      "curl",
      [
        "-sS",
        "--connect-timeout",
        "5",
        "--max-time",
        "20",
        "--retry",
        "2",
        "--retry-delay",
        "1",
        "--retry-all-errors",
        "-X",
        "POST",
        semgrepUrl,
        "-H",
        "content-type: application/json",
        "--data",
        payload,
      ],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
    );

    const docs = output
      .split(/\n(?=\{)/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (docs.length !== 1) {
      return { ids: [], count: 0, error: `expected one JSON response, got ${docs.length}` };
    }

    const parsed = JSON.parse(docs[0]);
    const results = Array.isArray(parsed.results) ? parsed.results : [];
    const errors = Array.isArray(parsed.errors) ? parsed.errors : [];
    return {
      ids: results.map((result) => result.check_id).filter(Boolean),
      count: results.length,
      error: errors.length ? errors.map((error) => error.message || String(error)).join("; ") : undefined,
    };
  } catch (error) {
    return {
      ids: [],
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeCategory(results, provider) {
  const categories = ["security", "runtime-semantic", "framework-version", "ai-cross-language"];
  return categories.map((category) => {
    const items = results.filter((result) => result.positive && result.category === category);
    const hits = items.filter((result) => result[provider].hit).length;
    return { category, hits, total: items.length };
  });
}

function printRatio(label, hits, total) {
  return `- ${label}: ${hits}/${total}`;
}

async function run() {
  compileRuleEngine();
  const { analyzeCode } = await loadRuleEngine();
  const samples = JSON.parse(readFileSync(samplesPath, "utf8"));
  const results = [];

  for (const [index, sample] of samples.entries()) {
    process.stderr.write(`[${index + 1}/${samples.length}] ${sample.id}\n`);
    const ruleResult = analyzeCode(sample.code, sample.language);
    const semgrepResult = postSemgrep(sample);
    const localIds = ruleResult.issues.map((issue) => issue.id);
    const combinedIds = [...localIds, ...semgrepResult.ids];
    const expectedPresent = sample.expectedPresent ?? [];
    const expectedAbsent = sample.expectedAbsent ?? [];
    const positive = expectedPresent.length > 0;
    const missing = expectedPresent.filter((id) => !combinedIds.includes(id));
    const unexpected = expectedAbsent.filter((id) => combinedIds.includes(id));

    results.push({
      id: sample.id,
      title: sample.title,
      category: classifySample(sample),
      positive,
      expectedPresent,
      expectedAbsent,
      local: {
        hit: positive ? expectedPresent.some((id) => localIds.includes(id)) : localIds.length > 0,
        count: localIds.length,
        ids: localIds,
      },
      semgrep: {
        hit: semgrepResult.count > 0,
        count: semgrepResult.count,
        ids: semgrepResult.ids,
        error: semgrepResult.error,
      },
      pipeline: {
        hit: positive ? missing.length === 0 : combinedIds.length > 0,
        count: combinedIds.length,
        ids: combinedIds,
        missing,
        unexpected,
      },
    });
  }

  const positiveResults = results.filter((result) => result.positive);
  const negativeResults = results.filter((result) => !result.positive);
  const pipelinePositiveHits = positiveResults.filter((result) => result.pipeline.missing.length === 0).length;
  const pipelineNegativeClean = negativeResults.filter((result) => result.pipeline.count === 0).length;
  const localPositiveHits = positiveResults.filter((result) => result.expectedPresent.every((id) => result.local.ids.includes(id))).length;
  const localNegativeClean = negativeResults.filter((result) => result.local.count === 0).length;
  const semgrepPositiveAnyHits = positiveResults.filter((result) => result.semgrep.hit).length;
  const semgrepNegativeClean = negativeResults.filter((result) => result.semgrep.count === 0).length;
  const providerErrors = results.filter((result) => result.semgrep.error).length;
  const generatedAt = new Date().toISOString();

  const misses = positiveResults.filter((result) => result.pipeline.missing.length > 0);
  const negativeFindings = negativeResults.filter((result) => result.pipeline.count > 0);

  const categoryRows = summarizeCategory(results, "pipeline").map((entry) => {
    const semgrepEntry = summarizeCategory(results, "semgrep").find((item) => item.category === entry.category);
    const localEntry = summarizeCategory(results, "local").find((item) => item.category === entry.category);
    return {
      category: entry.category,
      pipeline: `${entry.hits}/${entry.total}`,
      local: localEntry ? `${localEntry.hits}/${localEntry.total}` : "0/0",
      semgrep: semgrepEntry ? `${semgrepEntry.hits}/${semgrepEntry.total}` : "0/0",
    };
  });

  const markdown = [
    "# Static Pipeline Benchmark",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Semgrep API: ${semgrepUrl}`,
    "",
    `Samples: ${results.length} total, ${positiveResults.length} positive, ${negativeResults.length} negative`,
    "",
    printRatio("Static pipeline positive hit rate", pipelinePositiveHits, positiveResults.length),
    printRatio("Static pipeline negative clean rate", pipelineNegativeClean, negativeResults.length),
    printRatio("Local rule engine positive hit rate", localPositiveHits, positiveResults.length),
    printRatio("Local rule engine negative clean rate", localNegativeClean, negativeResults.length),
    printRatio("Live Semgrep provider positive any-hit rate", semgrepPositiveAnyHits, positiveResults.length),
    printRatio("Live Semgrep provider negative clean rate", semgrepNegativeClean, negativeResults.length),
    `- Live Semgrep provider error samples: ${providerErrors}`,
    "",
    "## Category Breakdown",
    "",
    "| Category | Static pipeline | Local rules | Live Semgrep provider |",
    "| --- | --- | --- | --- |",
    ...categoryRows.map((row) => `| ${row.category} | ${row.pipeline} | ${row.local} | ${row.semgrep} |`),
    "",
    "## Pipeline Misses",
    "",
    ...(misses.length
      ? misses.map((result) => `- \`${result.id}\` (${result.category}) - missing ${result.pipeline.missing.join(", ")}`)
      : ["- none"]),
    "",
    "## Negative Samples With Findings",
    "",
    ...(negativeFindings.length
      ? negativeFindings.map((result) => `- \`${result.id}\` - ${result.pipeline.ids.join(", ")}`)
      : ["- none"]),
    "",
    "## Provider Errors",
    "",
    ...(providerErrors
      ? results
          .filter((result) => result.semgrep.error)
          .map((result) => `- \`${result.id}\`: ${result.semgrep.error}`)
      : ["- none"]),
    "",
  ].join("\n");

  mkdirSync(reportDir, { recursive: true });
  writeFileSync(path.join(reportDir, "static-pipeline.latest.md"), markdown);
  writeFileSync(
    path.join(reportDir, "static-pipeline.latest.json"),
    JSON.stringify(
      {
        summary: {
          generatedAt,
          semgrepUrl,
          totalSamples: results.length,
          positiveSamples: positiveResults.length,
          negativeSamples: negativeResults.length,
          pipelinePositiveHitRate: `${pipelinePositiveHits}/${positiveResults.length}`,
          pipelineNegativeCleanRate: `${pipelineNegativeClean}/${negativeResults.length}`,
          localPositiveHitRate: `${localPositiveHits}/${positiveResults.length}`,
          semgrepPositiveAnyHitRate: `${semgrepPositiveAnyHits}/${positiveResults.length}`,
          providerErrors,
          categoryRows,
        },
        results,
      },
      null,
      2
    )
  );

  console.log(markdown);
  console.log(`Report written: ${path.join(reportDir, "static-pipeline.latest.md")}`);

  if (misses.length || negativeFindings.length) {
    process.exitCode = 1;
  }
}

try {
  await run();
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
