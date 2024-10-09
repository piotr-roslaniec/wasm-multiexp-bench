import { wrap } from "comlink";
import type { BenchmarkWorker } from "./worker";

// Note: This will be overridden by the Playwright test runner.
// The default implementation is provided only for manual testing.
// @ts-ignore
globalThis.onDone ??= () => console.log("OK");

const root = document.createElement("div");
document.body.appendChild(root);
root.style.display = "flex";
root.style.justifyContent = "center";
root.style.alignItems = "center";

const threadsStatus = document.createElement("div");
root.appendChild(threadsStatus);

const benchmarkStatus = document.createElement("div");
benchmarkStatus.textContent = "Preparing test...";
root.appendChild(benchmarkStatus);

const benchmarkSelect = document.createElement("select");
const options = ["arkworks", "ffjavascript"];
options.forEach((option) => {
  const opt = document.createElement("option");
  opt.value = option;
  opt.textContent = option;
  benchmarkSelect.appendChild(opt);
});
root.appendChild(benchmarkSelect);

const startButton = document.createElement("button");
startButton.textContent = "Start";
startButton.onclick = async () => {
  startButton.disabled = true;

  const selectedBenchmark = benchmarkSelect.value;
  benchmarkStatus.textContent = "Running benchmark...";
  try {
    const { average_ms } = await start(selectedBenchmark, 100, 2 ** 12);
    benchmarkStatus.innerHTML = `Average time: ${average_ms}ms<br>`;
  } catch (error: any) {
    console.error("Error running benchmark:", error);
    benchmarkStatus.textContent = `Error: ${error.message}`;
  } finally {
    startButton.disabled = false;
  }
};
root.appendChild(startButton);

const worker: Worker = new Worker(new URL("./worker.ts", import.meta.url), {
  name: "worker",
});

const workerAPI = wrap<BenchmarkWorker>(worker);

let threadsInitialized = false;

async function initThreads(threads?: number) {
  console.log(`initThreads`);
  if (!!threads && navigator.hardwareConcurrency < threads) {
    throw new Error(
      `Requested threads (${threads}) exceeds hardwareConcurrency (${navigator.hardwareConcurrency})`,
    );
  }
  if (threadsInitialized) {
    return;
  }
  await workerAPI.init(threads);
  threadsInitialized = true;
}

async function start(
  benchmarkFn: string,
  testCases: number,
  n: number,
): Promise<{ average_ms: number; median_ms: number }> {
  console.log(`Starting benchmark`);
  console.log(
    `BLS12-381 multi-exponentiation: ${benchmarkFn}, n=${n} elements, test cases=${testCases}`,
  );
  const { average_ms, median_ms } = await workerAPI.runBenchmark(
    n,
    testCases,
    benchmarkFn,
  );
  return { average_ms, median_ms };
}

// Expose some functions to the window for Playwright to call
// @ts-ignore
window.start = start;
// @ts-ignore
window.initThreads = initThreads;

startButton.disabled = true;

// Disabled because we are calling `page.evaluate` multiple times in test.spec.mjs
// Enabling may be necessary to run locally with `npm run start`
// TODO: Fix this
// const inputThreads = navigator.hardwareConcurrency;
// initThreads(inputThreads)
//   .then(() => {
//     root.appendChild(document.createElement("br"));
//     console.log(`Initialized ${inputThreads} threads`);
//     root.appendChild(threadsStatus);
//     benchmarkStatus.textContent = "Press Start to run the benchmark";
//     startButton.disabled = false;
//   })
//   .catch((error) => {
//     console.error("Error initializing threads:", error);
//     threadsStatus.textContent = `Error: ${error.message}`;
//   });
