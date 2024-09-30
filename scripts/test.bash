#!/usr/bin/bash

# Fail fast
set -e

# Print each command before it's executed
set -x

test_wasm() {
  export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+atomics,+bulk-memory,+mutable-globals -C link-arg=--max-memory=4294967296"
  export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUSTFLAGS=$RUSTFLAGS
  export WASM_BINDGEN_TEST_TIMEOUT=300

  wasm-pack test --release --headless --chrome
  wasm-pack test --release --headless --firefox
  #wasm-pack test --release --headless --safari # TODO: Use a macOS machine
  #wasm-pack test --release --node # TODO: Fix `Error: Cannot find module 'env'` error
}

test_packages() {
  (cd package-tests/node && npm i && npm run test)
  (cd package-tests/web && npm i && npm run test)
}

test_all() {
  test_wasm
  test_packages
}

test_all