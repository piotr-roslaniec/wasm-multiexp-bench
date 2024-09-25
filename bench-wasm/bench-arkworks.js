const { bench_bls12381 } = require("arkworks");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    const results = [];
    for (let NExp = 12; NExp <= 20; NExp++) {
      const N = 2 ** NExp;
      console.log(`BLS12-381 multi-exponentiation, N = ${N} elements`);

      const testCases = 20;
      const result = bench_bls12381(N, testCases);
      const { average_ms, median_ms } = result[0];
      console.log(`Average: ${average_ms} ms`);
      console.log(`Median: ${median_ms} ms`);
      results.push({ N, average_ms, median_ms });
    }

    const csvContent =
      "N,Average,Median\n" +
      results.map((r) => `${r.N},${r.average_ms},${r.median_ms}`).join("\n");
    const filePath = path.join(__dirname, "results-arkworks.csv");
    fs.writeFileSync(filePath, csvContent);
    console.log(`Results saved to ${filePath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
