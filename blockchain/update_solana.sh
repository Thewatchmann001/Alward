#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin:/home/watchmann001/.local/share/solana/install/active_release/bin

echo "=== Updating Solana CLI to latest stable ==="
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
echo "Solana update exit: $?"

export PATH=/home/watchmann001/.local/share/solana/install/active_release/bin:$PATH
solana --version
cargo build-sbf --version
