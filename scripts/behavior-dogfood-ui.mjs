import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const docsRoot = "/root/docs/checkaicode/dogfood_reports";
const screenshotDir = path.join(docsRoot, "screenshots", "2026-06-04_behavior_ui");
const baseUrl = process.env.E2E_BASE_URL || "https://checkaicode.com";
const runId = `behavior_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36)}`;
const cdpArg = process.argv.find((arg) => arg.startsWith("--cdp="));
const cdpEndpoint = cdpArg ? cdpArg.slice("--cdp=".length) : process.env.CDP_HTTP;
const sampleArg = process.argv.find((arg) => arg.startsWith("--sample="));
const sampleFilter = sampleArg ? new Set(sampleArg.slice("--sample=".length).split(",").filter(Boolean)) : null;
const scanModeArg = process.argv.find((arg) => arg.startsWith("--scan-mode="));
const scanMode = scanModeArg ? scanModeArg.slice("--scan-mode=".length) : "standard";
const privacyMode = process.argv.includes("--privacy");
const suffixArg = process.argv.find((arg) => arg.startsWith("--report-suffix="));
const reportSuffix = suffixArg ? suffixArg.slice("--report-suffix=".length).replace(/[^a-z0-9_-]/gi, "") : "";

if (!["standard", "deep"].includes(scanMode)) {
  throw new Error(`Unsupported --scan-mode value: ${scanMode}`);
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));

const samples = [
  {
    id: "clean-react-helper",
    title: "Clean TypeScript helper should stay quiet",
    language: "typescript",
    expected: "No issues. This checks whether the product can stay quiet on normal code.",
    code: `type User = { id: string; name: string };

export function displayName(user: User | null): string {
  if (!user) return "Guest";
  return user.name.trim() || "Unnamed";
}`,
  },
  {
    id: "ai-js-async-footguns",
    title: "AI-style JavaScript async footguns",
    language: "javascript",
    expected: "Should catch async forEach, ignored fetch, and parseInt without radix.",
    code: `async function syncUsers(users) {
  users.forEach(async (user) => {
    await saveUser(user);
  });

  fetch("/api/audit");
  const page = parseInt(new URL(location.href).searchParams.get("page"));
  return page;
}`,
  },
  {
    id: "python-security-footguns",
    title: "Python security and reliability footguns",
    language: "python",
    expected: "Should catch shell=True/os.system, requests without timeout, bare except, and SQL string building.",
    code: `import os
import requests
import subprocess

def load_user(user_id, path):
    try:
        os.system("cat " + path)
        subprocess.run("ls " + path, shell=True)
        requests.get("https://example.com/api/" + user_id)
        cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    except:
        return None`,
  },
  {
    id: "react-xss-deprecated",
    title: "React UI mistakes",
    language: "javascript",
    expected: "Should catch async useEffect, innerHTML, and deprecated lifecycle usage.",
    code: `function Widget({ html }) {
  useEffect(async () => {
    const result = await fetch("/api/widget");
    document.querySelector("#out").innerHTML = html;
  }, [html]);
}

class OldWidget extends React.Component {
  componentWillMount() {
    this.load();
  }
}`,
  },
  {
    id: "cross-language-hallucination",
    title: "Cross-language API hallucination",
    language: "python",
    expected: "Should catch JavaScript methods used in Python.",
    code: `def greet(name):
    cleaned = name.trim()
    return cleaned.toUpperCase()`,
  },
];

function headersFor(index) {
  const testIp = `198.51.100.${10 + index}`;
  return {
    ...(process.env.E2E_TEST_SECRET
      ? {
          "x-checkaicode-e2e-secret": process.env.E2E_TEST_SECRET,
          "x-checkaicode-e2e-ip": `${runId}_${index}`,
        }
      : {
          "x-forwarded-for": testIp,
          "x-real-ip": testIp,
        }),
  };
}

function summarizeIssues(issues = []) {
  return issues.slice(0, 5).map((issue) => ({
    severity: issue.severity,
    ruleId: issue.ruleId,
    line: issue.line,
    message: issue.message,
    source: issue.source,
  }));
}

function markdownReport(results) {
  const lines = [
    `# Check AI Code Behavior UI Dogfood${reportSuffix ? ` (${reportSuffix})` : ""} - 2026-06-04`,
    "",
    "## Scope",
    "",
    `- Target: \`${baseUrl}/review\``,
    `- Run id: \`${runId}\``,
    `- Scan mode: \`${scanMode}\``,
    `- Privacy Mode: \`${privacyMode ? "on" : "off"}\``,
    "- Method: Playwright opened the real review UI, selected language, pasted code, clicked Analyze, captured API response and visible result state.",
    cdpEndpoint
      ? `- Browser mode: connected to existing authenticated VNC Chrome via CDP \`${cdpEndpoint}\`.`
      : "- Browser mode: launched an isolated headless Chrome context.",
    cdpEndpoint
      ? "- Test isolation: used the authenticated browser session directly; no anonymous quota isolation headers were needed."
      : process.env.E2E_TEST_SECRET
        ? "- Test isolation: used `x-checkaicode-e2e-secret` with unique test IP headers."
        : "- Test isolation: Production has no `E2E_TEST_SECRET`, so this internal run used unique documentation-range `x-forwarded-for` values per sample.",
    "- Goal: evaluate whether the product behaves like a useful reviewer, not only whether static file scanning is clean.",
    "",
    "## Summary",
    "",
    `- Samples attempted: ${results.length}`,
    `- Completed: ${results.filter((result) => result.ok).length}`,
    `- Failed/blocking: ${results.filter((result) => !result.ok).length}`,
    `- Samples with zero issues: ${results.filter((result) => result.issueCount === 0).length}`,
    `- Samples with issues: ${results.filter((result) => result.issueCount > 0).length}`,
    "",
    "## Results",
    "",
  ];

  for (const result of results) {
    lines.push(`### ${result.title}`);
    lines.push("");
    lines.push(`- Sample id: \`${result.id}\``);
    lines.push(`- Language: \`${result.language}\``);
    lines.push(`- Expected: ${result.expected}`);
    lines.push(`- Status: ${result.ok ? "completed" : "failed"}`);
    lines.push(`- HTTP: ${result.httpStatus ?? "n/a"}`);
    lines.push(`- Score: ${result.score ?? "n/a"}`);
    lines.push(`- Issues: ${result.issueCount ?? "n/a"}`);
    if (result.summary) lines.push(`- Summary: ${result.summary}`);
    if (result.llmStatus) lines.push(`- LLM status: \`${JSON.stringify(result.llmStatus)}\``);
    if (result.error) lines.push(`- Error: ${result.error}`);
    if (result.screenshot) lines.push(`- Screenshot: \`${result.screenshot}\``);
    if (result.topIssues?.length) {
      lines.push("");
      lines.push("Top issues:");
      for (const issue of result.topIssues) {
        lines.push(`- \`${issue.ruleId}\` ${issue.severity} L${issue.line}: ${issue.message}`);
      }
    }
    lines.push("");
  }

  lines.push("## Product Notes");
  lines.push("");
  lines.push("- This run exercises the public UI path, not just the local rule engine.");
  lines.push("- Clean-code silence is treated as a positive result, because noisy scanners lose trust quickly.");
  lines.push("- Any mismatch between expected behavior and result should become either a benchmark sample or a UI copy/rule-quality task.");
  lines.push("");

  return lines.join("\n");
}

mkdirSync(screenshotDir, { recursive: true });

const systemChrome = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(
  (candidate) => existsSync(candidate)
);
const browser = cdpEndpoint
  ? await chromium.connectOverCDP(cdpEndpoint)
  : await chromium.launch({
      headless: true,
      executablePath: systemChrome,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
const sharedContext = cdpEndpoint ? browser.contexts()[0] : null;
const results = [];

try {
  const selectedSamples = sampleFilter ? samples.filter((sample) => sampleFilter.has(sample.id)) : samples;

  for (const [index, sample] of selectedSamples.entries()) {
    console.log(`Running sample ${index + 1}/${selectedSamples.length}: ${sample.id}`);
    const context =
      sharedContext ??
      (await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        extraHTTPHeaders: headersFor(index),
      }));
    const page = await context.newPage();

    const result = {
      id: sample.id,
      title: sample.title,
      language: sample.language,
      expected: sample.expected,
      ok: false,
      httpStatus: null,
      score: null,
      issueCount: null,
      summary: "",
      topIssues: [],
      llmStatus: null,
      error: "",
      screenshot: "",
    };

    try {
      await page.goto(`${baseUrl}/review`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector("textarea", { timeout: 15000 });
      if (scanMode === "deep") {
        await page.getByRole("button", { name: "Deep Thorough Scan" }).click({ timeout: 5000 });
      }
      if (privacyMode) {
        await page.locator('input[type="checkbox"]').check({ timeout: 5000 });
      }
      await page.selectOption("select", sample.language);
      await page.fill("input[placeholder='filename']", `${sample.id}.${sample.language === "python" ? "py" : "js"}`);
      await page.fill("textarea", sample.code);

      const [response] = await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes("/api/analyze") && response.request().method() === "POST",
          { timeout: 90000 }
        ),
        page.getByRole("button", { name: /Analyze|分析/ }).click(),
      ]);
      result.httpStatus = response.status();
      const payload = await response.json().catch(async () => ({ error: await response.text().catch(() => "") }));

      if (!response.ok()) {
        result.error = payload.error || `Analyze failed with HTTP ${response.status()}`;
      } else {
        result.ok = true;
        result.score = payload.score;
        result.issueCount = Array.isArray(payload.issues) ? payload.issues.length : 0;
        result.summary = payload.summary || "";
        result.topIssues = summarizeIssues(payload.issues);
        result.llmStatus = payload.llmStatus || null;
      }

      await page.waitForTimeout(750);
      const screenshotPath = path.join(
        screenshotDir,
        `${String(index + 1).padStart(2, "0")}-${reportSuffix ? `${reportSuffix}-` : ""}${sample.id}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      const screenshotPath = path.join(
        screenshotDir,
        `${String(index + 1).padStart(2, "0")}-${reportSuffix ? `${reportSuffix}-` : ""}${sample.id}-error.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      result.screenshot = screenshotPath;
    } finally {
      results.push(result);
      if (sharedContext) await page.close().catch(() => {});
      else await context.close();
    }
  }
} finally {
  if (!cdpEndpoint) await browser.close();
}

const reportBase = `2026-06-04_behavior_ui_dogfood${reportSuffix ? `_${reportSuffix}` : ""}`;
const jsonPath = path.join(docsRoot, `${reportBase}.json`);
const mdPath = path.join(docsRoot, `${reportBase}.md`);

writeFileSync(jsonPath, JSON.stringify({ runId, baseUrl, results }, null, 2));
writeFileSync(mdPath, markdownReport(results));

console.log(`Behavior UI dogfood complete: ${results.filter((result) => result.ok).length}/${results.length} completed`);
console.log(`Markdown report: ${mdPath}`);
console.log(`JSON report: ${jsonPath}`);

const failed = results.filter((result) => !result.ok);
if (failed.length) {
  console.log("Failed samples:");
  for (const result of failed) console.log(`- ${result.id}: ${result.error}`);
}

process.exit(failed.length ? 1 : 0);
