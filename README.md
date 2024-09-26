# wasm-multiexp-bench

This repository contains a set of benchmarks for the `ffjavascript` (`wasmcurves`) and Arkworks. We are comparing
multi-exponentiation on the BLS12-381 curve.

## Usage

Build and run with:

```bash
cd ../
wasm-pack build --release  --target nodejs
cd bench-wasm
npm i
npm run bench
```

Inspect results in `bench-wasm/*.csv` files or plot them:

```bash
pip install pandas matplotlib
python plot.py
```
