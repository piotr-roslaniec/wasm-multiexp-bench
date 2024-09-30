const { buildBls12381, BigBuffer } = require("ffjavascript");
const fs = require("fs");
const path = require("path");

// To be used by the 'ffjavascript' library
const logger = {
  error: (msg) => {
    console.log("ERROR: " + msg);
  },
  warning: (msg) => {
    console.log("WARNING: " + msg);
  },
  info: (msg) => {
    console.log("INFO: " + msg);
  },
  debug: (msg) => {
    console.log("DEBUG: " + msg);
  },
};

async function runBenchmark(singleThread) {
  let singleThreadStr = singleThread ? "single-thread" : "multi-thread";
  const bls12381 = await buildBls12381(singleThread);
  const results = [];

  try {
    const Fr = bls12381.Fr;
    const G1 = bls12381.G1;

    for (let NExp = 12; NExp <= 20; NExp++) {
      const N = 2 ** NExp;
      console.log(
        `BLS12-381 multi-exponentiation, ${singleThreadStr}, N = ${N} elements`,
      );

      const scalars = new BigBuffer(N * bls12381.Fr.n8);
      const bases = new BigBuffer(N * G1.F.n8 * 2);
      let acc = Fr.zero;

      // Setup scalars and bases
      for (let i = 0; i < N; i++) {
        const num = Fr.e(i + 1);
        scalars.set(num, i * bls12381.Fr.n8); // Assuming num is in Montgomery form
        bases.set(G1.toAffine(G1.timesFr(G1.g, num)), i * G1.F.n8 * 2);
        acc = Fr.add(acc, Fr.square(num));
      }

      const testCases = 20;
      const testResults = [];
      for (let i = 0; i < testCases; i++) {
        const now = performance.now();
        // Use multiExpAffine for affine coordinates
        // const _accG = await G1.multiExpAffine(bases, scalars, logger, "test");
        const _accG = await G1.multiExpAffine(bases, scalars); // Not using the logger
        const elapsed = performance.now() - now;
        testResults.push(elapsed);
      }

      const avg = testResults.reduce((a, b) => a + b) / testResults.length;
      const median = testResults.sort()[Math.floor(testResults.length / 2)];
      console.log(`Average: ${avg} ms`);
      console.log(`Median: ${median} ms`);

      results.push({ N, avg, median });
    }
    const csvContent =
      "N,Average,Median\n" +
      results.map((r) => `${r.N},${r.avg},${r.median}`).join("\n");
    const filePath = path.join(
      __dirname,
      `results-ffjavascript-${singleThreadStr}.csv`,
    );
    fs.writeFileSync(filePath, csvContent);
    console.log(`Results saved to ${filePath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    bls12381.terminate();
  }
}

(async () => {
  await runBenchmark(true);
  await runBenchmark(false);
})();
