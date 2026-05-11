#!/bin/bash
export PATH=$PATH:/home/watchmann001/.local/share/solana/install/active_release/bin:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain/programs/milestone-escrow
echo "Building with cargo build-sbf..."
cargo build-sbf
