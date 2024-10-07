import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

const RESULT_LOG_PREFIX = "result_log:";

const getLogFilePath = (testInfo) => {
  const unixTimestamp = Math.floor(Date.now() / 1000);
  const randomNumber = Math.floor(Math.random() * 1000);
  const outputDirectory = "pw-outputs";
  fs.mkdirSync(outputDirectory, { recursive: true });
  return path.join(
    outputDirectory,
    `${testInfo.project.name}_${unixTimestamp}_${randomNumber}`,
  );
};

const appendLogMessage = (testInfo, logFile, logMessage) => {
  const outputFile = logFile + ".log";
  logMessage = logMessage.trim();
  fs.writeFileSync(outputFile, logMessage + "\n", {
    encoding: "utf8",
    flag: "a+",
  });
};

const processResultLogMessage = (logMessage) => {
  logMessage = logMessage.replace(RESULT_LOG_PREFIX, "");
  const maybeResult = JSON.parse(logMessage);
  if (!maybeResult || typeof maybeResult !== "object") {
    throw new Error(
      `Invalid result log message. Expected JSON object, got: ${logMessage}`,
    );
  }
  return maybeResult;
};

const appendResultRecord = (testInfo, logFile, config, result) => {
  const toWrite = {
    result,
    metaData: {
      project: testInfo.project.name,
      config,
    },
  };
  const resultFile = logFile + ".result.txt";
  fs.writeFileSync(resultFile, JSON.stringify(toWrite) + "\n", {
    encoding: "utf8",
    flag: "a+",
  });
};

// Benchmark configs
const BASE = {
  testCases: 10,
  threads: undefined,
  n: 2 ** 16,
};
const ARKWORKS = {
  ...BASE,
  method: "arkworks",
};
const FFJAVASCRIPT = {
  ...BASE,
  method: "ffjavascript",
};
const TEST_CONFIGS = {
  // For testing, we use `arkworks` to make sure that the WASM setup works with Playwright - One test case is enough
  test_st: { ...ARKWORKS, testCases: 1, n: 2 ** 6 },
  test_mt: { ...ARKWORKS, testCases: 1, threads: "max_concurrency", n: 2 ** 6 },
};
const BENCHMARK_CONFIGS = {
  st_arkworks: ARKWORKS,
  st_ffjavascript: FFJAVASCRIPT,
  // We set max-concurrency here because `ffjavascript` automatically pick max threads too
  mt_ffjavascript: { ...FFJAVASCRIPT, threads: "max_concurrency" },
  mt_arkworks: { ...ARKWORKS, threads: "max_concurrency" },
};

const ALL_CONFIGS = {
  ...TEST_CONFIGS,
  ...BENCHMARK_CONFIGS,
};

const parseConfig = () => {
  const envVar = process.env.SELECTED_PW_CONFIGS;
  if (!envVar) {
    throw Error("Must set SELECTED_PW_CONFIGS env var");
  }
  console.log(`Selected configs: ${envVar}`);

  if (envVar === "ALL_TEST") {
    return Object.values(TEST_CONFIGS);
  }

  if (envVar === "ALL_BENCH") {
    return Object.values(BENCHMARK_CONFIGS);
  }

  const configs = envVar.split(",");
  return configs.map((selectedConfig) => {
    const config = ALL_CONFIGS[selectedConfig];
    if (!config) {
      throw new Error(`Unknown test config: ${selectedConfig}`);
    }
    return config;
  });
};

const selectedConfigs = parseConfig();
console.log(`Selected ${selectedConfigs.length} config(s)`);
for (const config of selectedConfigs) {
  test(`running config: ${JSON.stringify(config)}`, async ({
    page,
  }, testInfo) => {
    const logFile = getLogFilePath(testInfo);
    console.log(`Logging to: ${logFile}`);

    page.on("console", (consoleLog) => {
      console.log(`console.log: ${consoleLog.text()}`);
      if (consoleLog.text().startsWith(RESULT_LOG_PREFIX)) {
        const result = processResultLogMessage(consoleLog.text());
        appendResultRecord(testInfo, logFile, config, result);
      } else {
        appendLogMessage(testInfo, logFile, consoleLog.text());
      }
    });

    if (config.threads === "max_concurrency") {
      config.threads = await page.evaluate(() => {
        return navigator.hardwareConcurrency;
      });
      console.log(`Updated number of threads to max: ${config.threads}`);
    }

    await page.goto(`/index.html`);

    await page.evaluate(async (config) => {
      await window.initThreads(config.threads);
      await window.start(config.method, config.testCases, config.n);
    }, config);
  });
}
