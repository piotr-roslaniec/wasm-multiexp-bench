import { defineConfig } from "@playwright/test";

import defaultConfig from "./playwright.base.config.mjs";

export default defineConfig({
  ...defaultConfig,
});
