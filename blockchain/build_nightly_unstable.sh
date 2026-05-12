#!/bin/bash
export PATH=$PATH:/home/watchmann001/.local/share/solana/install/active_release/bin:/home/watchmann001/.avm/bin:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Building programs with nightly and unstable options..."
# Use nightly and enable unstable features if possible
cargo +nightly build-sbf -Z unstable-options
