/**
 * E2E 测试：核心 review 流程
 *
 * 前置条件：
 *   1. 已运行 e2e/auth.setup.ts 保存登录态到 e2e/.auth/user.json
 *   2. 环境变量 E2E_TEST_SECRET 已配置
 *
 * 运行：
 *   E2E_TEST_SECRET=xxx npx playwright test e2e/review.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE_URL = "https://checkaicode.com";
const E2E_SECRET = process.env.E2E_TEST_SECRET || "";
const E2E_RUN_ID = `e2e_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36).slice(-3)}`;

test.use({
  storageState: "e2e/.auth/user.json",
  extraHTTPHeaders: {
    "x-checkaicode-e2e-secret": E2E_SECRET,
    "x-checkaicode-e2e-ip": E2E_RUN_ID,
  },
});

test.describe("Review flow", () => {
  test("anonymous user can scan code and get results", async ({ page }) => {
    await page.goto(`${BASE_URL}/review`);

    // 等待编辑器加载
    await page.waitForSelector("textarea[placeholder*='Paste your code']", {
      timeout: 10000,
    });

    // 输入测试代码
    const testCode = `function add(a, b) { return a + b; }`;
    await page.fill("textarea[placeholder*='Paste your code']", testCode);

    // 点击 Analyze
    await page.click('button:has-text("Analyze")');

    // 等待结果出现（成功或 429）
    await page.waitForSelector("text=Score", { timeout: 30000 });

    const scoreVisible = await page.locator("text=Score").isVisible();
    expect(scoreVisible).toBe(true);
  });

  test("logged-in user sees remaining usage", async ({ page }) => {
    await page.goto(`${BASE_URL}/review`);

    await page.waitForSelector("textarea[placeholder*='Paste your code']", {
      timeout: 10000,
    });

    // 检查剩余次数标签是否显示
    const usageLocator = page.locator("text=/\\d+\\/\\d+ remaining/i");
    const hasUsage = await usageLocator.isVisible().catch(() => false);

    // 或者 Pro 标签
    const proLocator = page.locator("text=Pro");
    const isPro = await proLocator.isVisible().catch(() => false);

    expect(hasUsage || isPro).toBe(true);
  });
});
