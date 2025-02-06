#!/bin/bash

# Sets up a benchmarking env for Ubuntu 22.04
# To be used on an isolated env, like a VM

# Update package list
sudo apt update

# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Install wasm-pack for WebAssembly
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Clang
sudo apt install -y clang

# Set Rust nightly toolchain and add required components
rustup default nightly
rustup component add rust-src --toolchain nightly-x86_64-unknown-linux-gnu

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source "$HOME"/.bashrc

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install and use Node.js version 18
nvm install 18
nvm use 18

# Install Playwright with all dependencies
(cd bench-wasm-web && npm install && npx playwright install --with-deps chromium firefox) # works despite missing deps/errors