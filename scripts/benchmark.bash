#!/bin/bash

# Fail fast
set -e
# Print each command before it's executed
set -x

run_benchmarks() {
    local cargo_file=$1
    local benchmark_file=$2

    cp $cargo_file Cargo.toml
    bash scripts/build.bash

    cd "bench-wasm-web"
    rm -rf pw-outputs node_modules
    npm i
    npm run benchmark
    npm run parse-benchmark
    cp BENCHMARK.md bench-results/$benchmark_file

    cd ..
}

# Run benchmarks for Arkworks 0.4
run_benchmarks "Cargo-old.toml" "BENCHMARK-old.md"

# Run benchmarks for Arkworks 0.5
run_benchmarks "Cargo-new.toml" "BENCHMARK-new.md"