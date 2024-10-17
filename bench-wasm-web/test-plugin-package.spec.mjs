import { chromium, test } from "@playwright/test";
import { TracePlugin } from "playwright-perf-plugin";

const TEST_CONFIG = {
  numRuns: 1,
  threads: undefined,
  method: "arkworks",
  n: 2 ** 10,
  testCases: 1,
};

const observableCalls = [
  "<ark_ff::fields::models::fp::Fp<P,_> as core::ops::arith::MulAssign<&ark_ff::fields::models::fp::Fp<P,_>>>::mul_assign::h4bc49a840ba2a0eb",
];

test("Measure performance of WASM calls", async () => {
  const COUNT = 10;

  const duration = {};
  for (const call of observableCalls) {
    duration[call] = 0;
  }

  for (let i = 0; i < COUNT; i++) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/index.html");

    const tracePlugin = new TracePlugin(browser, page, observableCalls);
    await tracePlugin.startTracing(page);

    await page.evaluate(async (config) => {
      await window.initThreads(config.threads);
      await window.start(config.method, config.testCases, config.n);
    }, TEST_CONFIG);

    const tracing = await tracePlugin.stopTracing();
    for (const call of observableCalls) {
      duration[call] = tracing.duration[call] / COUNT;
    }

    // Use trace events found here to update observableCalls:
    // for (const eventName of tracing.eventNames) {
    //     console.log({ eventName });
    // }

    await browser.close();
  }

  console.log("****Execution Time****");
  for (const call of observableCalls) {
    console.log(`${call}: ${duration[call]}ms`);
  }
  console.log("********************");
});
