/**
 * Playwright auth setup: 人工登录一次后保存 storageState
 *
 * 首次运行：
 *   E2E_TEST_SECRET=xxx npx playwright test e2e/auth.setup.ts --headed
 *
 * 登录成功后 storageState 保存到 e2e/.auth/user.json
 * 后续测试复用该状态，跳过登录流程。
 */
import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("https://checkaicode.com/auth/signin");

  // 等待 GitHub 登录按钮出现
  await page.waitForSelector('button:has-text("Sign in with GitHub")', {
    timeout: 10000,
  });
  await page.click('button:has-text("Sign in with GitHub")');

  // 如果 GitHub 要求登录，这里会停在登录页——需要人工输入
  // 登录成功后自动保存 storageState
  await page.waitForURL("https://checkaicode.com/review", { timeout: 60000 });

  // 确认登录成功
  await expect(page.locator("text=Paste your code")).toBeVisible();

  // 保存登录态
  await page.context().storageState({ path: authFile });
  console.log(`Auth state saved to ${authFile}`);
});
