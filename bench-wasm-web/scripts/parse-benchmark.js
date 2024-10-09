const fs = require("fs");
const path = require("path");

function findPwOutputsDir(startPath) {
  const files = fs.readdirSync(startPath);
  for (const file of files) {
    const fullPath = path.join(startPath, file);
    if (fs.statSync(fullPath).isDirectory() && file === "pw-outputs") {
      return fullPath;
    }
  }
  throw new Error("pw-outputs directory not found");
}

function parseBenchmarkResults(directory) {
  const results = [];
  const files = fs.readdirSync(directory);
  files.forEach((filename) => {
    if (filename.endsWith(".result.txt")) {
      const filepath = path.join(directory, filename);
      const data = JSON.parse(fs.readFileSync(filepath, "utf8"));
      results.push(data);
    }
  });
  return results;
}

function writeResultsToMarkdown(results, markdownFile) {
  const header =
    `| Method | Average Time (ms) | Median Time (ms) | Benchmark | Test Cases | Threads | N |\n` +
    `|--------|-------------------|------------------|-----------|------------|---------|---|\n`;

  // Group results by threads and sort within each group
  const groupedResults = results.reduce((acc, result) => {
    const key = result.metaData.config.threads || "undefined";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {});

  const sortedResults = Object.keys(groupedResults)
    .sort((a, b) => (a === "undefined" ? -1 : b === "undefined" ? 1 : a - b))
    .flatMap((key) => {
      const group = groupedResults[key];
      const ffjavascriptBaseline = group.find(
        (result) => result.metaData.config.method === "ffjavascript",
      );
      if (ffjavascriptBaseline) {
        group.sort((a, b) => {
          if (a.metaData.config.method === "ffjavascript") return -1;
          if (b.metaData.config.method === "ffjavascript") return 1;
          return a.result.average_ms - b.result.average_ms;
        });
      }
      return group;
    });

  const rows = sortedResults
    .map((result) => {
      const averageTime = result.result.average_ms.toFixed(2);
      const medianTime = result.result.median_ms.toFixed(2);
      const baseline = groupedResults[
        result.metaData.config.threads || "undefined"
      ].find((r) => r.metaData.config.method === "ffjavascript");
      const avgDifference = baseline
        ? (
            ((result.result.average_ms - baseline.result.average_ms) /
              baseline.result.average_ms) *
            100
          ).toFixed(2)
        : "N/A";
      const medDifference = baseline
        ? (
            ((result.result.median_ms - baseline.result.median_ms) /
              baseline.result.median_ms) *
            100
          ).toFixed(2)
        : "N/A";
      const averageTimeWithDifference = baseline
        ? `${averageTime} (${avgDifference}%)`
        : averageTime;
      const medianTimeWithDifference = baseline
        ? `${medianTime} (${medDifference}%)`
        : medianTime;
      return `| ${result.metaData.config.method} | ${averageTimeWithDifference} | ${medianTimeWithDifference} | ${result.metaData.project} | ${result.metaData.config.testCases} | ${result.metaData.config.threads || "undefined"} | ${result.metaData.config.n} |`;
    })
    .join("\n");

  const markdownContent = header + rows;

  fs.writeFileSync(markdownFile, markdownContent);
}

function main() {
  const markdownFile = process.argv[2];
  if (!markdownFile) {
    console.error("Please provide a markdown file name as an argument.");
    process.exit(1);
  }

  const directory = findPwOutputsDir(".");
  const results = parseBenchmarkResults(directory);
  writeResultsToMarkdown(results, markdownFile);
}

main();
