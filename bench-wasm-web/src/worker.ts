import { expose } from "comlink";
import * as arkworksMultithreaded from "arkworks/web-multithreaded";
import * as arkworksSinglethreaded from "arkworks/web-singlethreaded";
const { buildBls12381, BigBuffer } = require("ffjavascript"); // Doesn't support `import`-style imports

let threadsInitialized = false;

export class BenchmarkWorker {
  public async init(threads?: number): Promise<void> {
    console.log(`BenchmarkWorker: init(threads=${threads})`);
    if (threads !== undefined && threads > 1) {
      await arkworksMultithreaded.default();
      console.log(`BenchmarkWorker: initThreadpool`);
      await arkworksMultithreaded.initThreadPool(threads);
      threadsInitialized = true;
    } else {
      await arkworksSinglethreaded.default();
      threadsInitialized = false;
    }
    console.log(`BenchmarkWorker: init(threads=${threads}) done`);
  }

  private static async benchmarkFn(benchmarkFn: string) {
    switch (benchmarkFn) {
      case "ffjavascript": {
        const fn = async (n: number, testCases: number) => {
          const singleThread = !threadsInitialized;
          const bls12381 = await buildBls12381(singleThread);

          const Fr = bls12381.Fr;
          const G1 = bls12381.G1;
          const scalars = new BigBuffer(n * bls12381.Fr.n8);
          const bases = new BigBuffer(n * G1.F.n8 * 2);
          let acc = Fr.zero;

          // Setup scalars and bases
          for (let i = 0; i < n; i++) {
            const num = Fr.e(i + 1);
            scalars.set(num, i * bls12381.Fr.n8); // Assuming num is in Montgomery form
            bases.set(G1.toAffine(G1.timesFr(G1.g, num)), i * G1.F.n8 * 2);
            acc = Fr.add(acc, Fr.square(num));
          }

          const testResults = [];
          for (let i = 0; i < testCases; i++) {
            const now = performance.now();
            await G1.multiExpAffine(bases, scalars);
            const elapsed = performance.now() - now;
            testResults.push(elapsed);
          }

          const average_ms =
            testResults.reduce((a, b) => a + b) / testResults.length;
          const median_ms =
            testResults.sort()[Math.floor(testResults.length / 2)];
          return [{ average_ms, median_ms }];
        };

        return fn;
      }
      case "arkworks": {
        if (threadsInitialized) {
          return arkworksMultithreaded.bench_bls12381;
        } else {
          return arkworksSinglethreaded.bench_bls12381;
        }
      }
      default: {
        throw Error(`Unknown benchmark function: ${benchmarkFn}`);
      }
    }
  }

  public async runBenchmark(
    n: number,
    testCases: number,
    benchmarkFn: string,
  ): Promise<{ average_ms: number; median_ms: number }> {
    console.log(`BenchmarkWorker: runBenchmark(${n}, ${testCases})`);
    const fn = await BenchmarkWorker.benchmarkFn(benchmarkFn);
    const result = await fn(n, testCases);
    const { average_ms, median_ms } = result[0];
    console.log(
      `result_log:${JSON.stringify({ average_ms, median_ms, benchmarkFn })}`,
    );
    console.log(`BenchmarkWorker: runBenchmark() done`);
    return { average_ms, median_ms };
  }
}

const benchmarkWorker = new BenchmarkWorker();
expose(benchmarkWorker);
