# `bench-wasm-web`

# Usage

Before running, make sure to install WASM and Playwright dependencies:

```bash
cd ../
bash ./scripts/build.bash

cd bench-wasm-web
npm i
npm run setup-playwright
```

# Benchmarks

## Running the benchmarks

In order to run the benchmarks, execute the following command:

```bash
npm run benchmark
```

This command will create `pw-outputs` directory with some intermediate results. In order to generate human-readable
benchmark outputs, run:

```
npm run parse-benchmark benchmark.md
```

This will generate `pw-outputs/benchmark.md` file with the benchmark results.

In order to run the benchmarks locally with these parameters, you can run:

```bash
export SELECTED_PW_CONFIGS=benchmark_merkle_mt_8
npm run benchmark --project chromium
```

# Notes

This example takes advantage of experimental async WASM loading in `webpack-5`. See `webpack.config.js` for details:

```
  experiments: {
    asyncWebAssembly: true,
  },
```
