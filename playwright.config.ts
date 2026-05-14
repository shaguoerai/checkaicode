import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 配置
 *
 * 环境变量：
 *   E2E_TEST_SECRET — 测试隔离 secret（必须）
 *   E2E_BASE_URL    — 测试目标（默认 https://checkaicode.com）
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // E2E 串行避免额度冲突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单 worker，避免并发消耗额度
  reporter: [
    ["list"],
    ["json", { outputFile: "e2e/report.json" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://checkaicode.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // 1. 先跑登录保存 storageState
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // 2. 复用登录态的测试
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
