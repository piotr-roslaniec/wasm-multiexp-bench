#!/bin/bash

# Fail fast
set -e
# Print each command before it's executed
set -x

run_benchmarks() {
    local mode=$1

    local cargo_file="Cargo-$mode.toml"
    local benchmark_file="BENCHMARK-$mode.md"
    local pw_output_file="pw-outputs-$mode"

    cp $cargo_file Cargo.toml
    bash scripts/build.bash

    cd "bench-wasm-web"
    rm -rf pw-outputs node_modules
    npm i
    npm run benchmark
    npm run parse-benchmark
    mkdir -p ../bench-results
    cp BENCHMARK.md ../bench-results/$benchmark_file
    cp -r pw-outputs ../bench-results/$pw_output_file

    cd ..
}

# Run benchmarks for Arkworks 0.4 (old)
run_benchmarks "old"

# Run benchmarks for Arkworks 0.5 (new)
run_benchmarks "new"


