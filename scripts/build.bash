#!/bin/bash

set -e

# sed command works has different syntax in MacOS
OS=$(uname)
if [ "$OS" == "Darwin" ]; then
  SED_CMD="sed -i ''"
else
  SED_CMD="sed -i"
fi

clean() {
  rm -rf pkg*
}

build_pkg() {
    MODE=dev
#    MODE=release
    wasm-pack build --${MODE} --target nodejs --out-dir pkg/pkg-node --no-default-features
    wasm-pack build --${MODE} --target web --out-dir pkg/pkg-web-singlethreaded
    wasm-pack build --${MODE} --target web --out-dir pkg/pkg-web-multithreaded --features multithreading
    cp package.template.json pkg/package.json
}

update_package_nodejs() {
  $SED_CMD "s/require('env')/{memory: new WebAssembly.Memory({initial: 100,maximum: 65536,shared: true,})}/g" pkg/pkg-node/wasm_multiexp_bench.js
}

update_package_web() {
  $SED_CMD "s|import initWbg, { wbg_rayon_start_worker } from '../../../';|import initWbg, { wbg_rayon_start_worker } from '../../../wasm_multiexp_bench';|g" pkg/pkg-web-multithreaded/snippets/wasm-bindgen-rayon-3e04391371ad0a8e/src/workerHelpers.worker.js
}

remove_unused_files() {
  (cd pkg/pkg-web-singlethreaded && rm README.md package.json .gitignore)
  (cd pkg/pkg-web-multithreaded && rm README.md package.json .gitignore)
  (cd pkg/pkg-node && rm README.md package.json .gitignore)
}




main() {
  clean
  build_pkg
  update_package_nodejs
  update_package_web
  remove_unused_files
}

main

echo "Done"