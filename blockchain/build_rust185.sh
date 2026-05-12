#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin:/home/watchmann001/.local/share/solana/install/active_release/bin

# Force Rust 1.85 so cargo binary is the new one
rustup default 1.85.0

# Override the CARGO binary used by cargo build-sbf to Rust 1.85's cargo
CARGO_BIN=$(rustup which cargo)
echo "Using cargo: $CARGO_BIN"
$CARGO_BIN --version

cd /mnt/c/Users/user/ALWARD/blockchain

echo "=== Building milestone-escrow ==="
CARGO=$CARGO_BIN cargo build-sbf --manifest-path programs/milestone-escrow/Cargo.toml
echo "Exit code: $?"

echo "=== Building startup-registry ==="
CARGO=$CARGO_BIN cargo build-sbf --manifest-path programs/startup-registry/Cargo.toml
echo "Exit code: $?"

echo "=== Checking .so files ==="
ls -la target/deploy/*.so 2>/dev/null && echo "SUCCESS!" || echo "FAILED: no .so files"
