import { devices } from "@playwright/test";

const url = `http://127.0.0.1:3000/`;

export default {
  timeout: 5 * 60 * 1000, // 5 minutes
  fullyParallel: true, // Run tests in parallel
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list", // TODO: Make sure it works on CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests only on CI
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: "npm run build && npm run start:prod",
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
  ],
};
