# bench-wasmcurves

This is a benchmarking tool for WebAssembly implementations of elliptic curves.

We are using `ffjavascript` instead of `wasmcurves` directly, because this is the preferred method according
to [the project README](https://github.com/iden3/wasmcurves/blob/master/README.md).

## Installation

Build WASM dependencies first:

```bash
cd ..
wasm-pack build --target nodejs
```

## Usage

```bash
npm i
npm run bench
```
