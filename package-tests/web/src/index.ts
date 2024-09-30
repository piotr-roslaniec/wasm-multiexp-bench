import * as single from "wasm_multiexp_bench/web-singlethreaded";
import * as multi from "wasm_multiexp_bench/web-multithreaded";

// Note: this will be overridden by the Playwright test runner.
// The default implementation is provided only for manual testing.
// @ts-ignore
globalThis.onDone ??= () => console.log("OK");

async function start(config: "single" | "multi") {
  console.log("Starting test");
  console.log("Config:", config);

  if (config === "single") {
    await single.default();
    single.bench_bls12381(1, 1);
  } else if (config === "multi") {
    await multi.default();
    await multi.initThreadPool(navigator.hardwareConcurrency);
    multi.bench_bls12381(1, 1);
  } else {
    throw new Error(`Invalid config: ${config}`);
  }

  console.log("Test done");
}

// Expose the start function to the window for Playwright to call
// @ts-ignore
window.start = start;
