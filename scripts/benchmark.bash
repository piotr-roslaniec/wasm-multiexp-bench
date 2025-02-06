#!/bin/bash

# Fail fast
set -e
# Print each command before it's executed
set -x

run_benchmarks() {
    local mode=$1

    local cargo_file="Cargo-$mode.toml"
    local benchmark_file="BENCHMARK-$mode.md"
    local pw_output_dir="pw-outputs-$mode"

    cp "$cargo_file" Cargo.toml
    bash scripts/build.bash

    cd "bench-wasm-web"
    rm -rf pw-outputs node_modules
    npm i
    npm run benchmark
    npm run parse-benchmark

    cp BENCHMARK.md ../bench-results/"$benchmark_file"
    rm -rf ../bench-results/"$pw_output_dir"
    mv pw-outputs ../bench-results/"$pw_output_dir"

    cd ..
}

# Run benchmarks for Arkworks 0.4 (old)
run_benchmarks "old"

# Run benchmarks for Arkworks 0.5 (new)
run_benchmarks "new"


