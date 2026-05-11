#!/bin/bash
export PATH=$PATH:/home/watchmann001/.local/share/solana/install/active_release/bin:/home/watchmann001/.avm/bin:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Building programs with nightly..."
anchor build
echo "Deploying programs to devnet..."
anchor deploy --provider.cluster devnet
