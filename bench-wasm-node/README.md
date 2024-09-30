# bench-wasm

We are using `ffjavascript` instead of `wasmcurves` directly, because this is the preferred method according
to [the project README](https://github.com/iden3/wasmcurves/blob/master/README.md).

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
