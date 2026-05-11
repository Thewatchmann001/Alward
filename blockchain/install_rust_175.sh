#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
echo "Installing Rust 1.75.0..."
rustup toolchain install 1.75.0
echo "Setting 1.75.0 as default..."
rustup default 1.75.0
