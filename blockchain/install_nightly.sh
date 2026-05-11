#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
echo "Installing nightly..."
rustup toolchain install nightly
echo "Setting nightly as default..."
rustup default nightly
