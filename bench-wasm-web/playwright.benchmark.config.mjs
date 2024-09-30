import { defineConfig } from "@playwright/test";

import defaultConfig from "./playwright.base.config.mjs";

export default defineConfig({
  ...defaultConfig,
  timeout: 90 * 60 * 1000, // 90 minutes
  workers: 1, // Run projects sequentially
  fullyParallel: false, // Run tests sequentially
});
