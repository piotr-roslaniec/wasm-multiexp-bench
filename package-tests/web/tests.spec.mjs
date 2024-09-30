import { test } from "@playwright/test";

for (const config of ["single", "multi"]) {
  test(`wasm ${config}-threaded build`, async ({ page }) => {
    page.on("console", (consoleLog) => {
      console.log(`console.log: ${consoleLog.text()}`);
    });

    await page.goto(`/index.html`);

    await page.evaluate(async (config) => {
      await window.start(config);
    }, config);
  });
}
