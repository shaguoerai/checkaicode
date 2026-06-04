/**
 * E2E 测试报告生成器
 * 将 Playwright 的 JSON 报告转为 Markdown 摘要
 *
 * 用法：
 *   npx tsx e2e/report.ts <playwright-report.json>
 */
import * as fs from "fs";

interface TestResult {
  title: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  duration: number;
  error?: string;
}

interface Suite {
  title: string;
  tests: TestResult[];
}

interface Report {
  stats: {
    total: number;
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
    duration: number;
  };
  suites: Suite[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error("Usage: npx tsx e2e/report.ts <playwright-report.json>");
    process.exit(1);
  }

  let report: Report;
  try {
    const raw = fs.readFileSync(inputFile, "utf-8");
    report = JSON.parse(raw);
  } catch (error) {
    console.error(
      `Failed to read Playwright JSON report: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  const lines: string[] = [];
  lines.push(`# E2E Test Report`);
  lines.push("");
  lines.push(`- **Total**: ${report.stats.total}`);
  lines.push(`- **Passed**: ${report.stats.expected}`);
  lines.push(`- **Failed**: ${report.stats.unexpected}`);
  lines.push(`- **Flaky**: ${report.stats.flaky}`);
  lines.push(`- **Skipped**: ${report.stats.skipped}`);
  lines.push(`- **Duration**: ${formatDuration(report.stats.duration)}`);
  lines.push("");

  for (const suite of report.suites) {
    lines.push(`## ${suite.title}`);
    lines.push("");
    for (const test of suite.tests) {
      const icon =
        test.status === "passed"
          ? "✅"
          : test.status === "failed"
          ? "❌"
          : test.status === "timedOut"
          ? "⏱️"
          : "⏭️";
      lines.push(`- ${icon} **${test.title}** (${formatDuration(test.duration)})`);
      if (test.error) {
        lines.push(`  \`\`\``);
        lines.push(`  ${test.error.split("\n").slice(0, 3).join("\n  ")}`);
        lines.push(`  \`\`\``);
      }
    }
    lines.push("");
  }

  const md = lines.join("\n");
  const outFile = inputFile.replace(/\.json$/, ".md");
  fs.writeFileSync(outFile, md);
  console.log(`Report written to ${outFile}`);
  console.log(md);
}

main();
