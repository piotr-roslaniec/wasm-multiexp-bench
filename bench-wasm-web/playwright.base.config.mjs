import { devices } from "@playwright/test";

const url = `http://127.0.0.1:3000/`;

export default {
  timeout: 10 * 60 * 1000, // 10 minutes
  fullyParallel: true, // Run tests in parallel
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0, // Retry failed tests only on CI
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: "pnpm build && pnpm start:prod",
    url,
    reuseExistingServer: false,
  },
  use: {
    baseURL: url,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox hangs up/runs indefinitely
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // Wasm doesn't seem to work in Playwright Webkit.
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // }
  ],
};
