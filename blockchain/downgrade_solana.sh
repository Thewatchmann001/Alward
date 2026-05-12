#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Downgrading solana-program..."
cargo update -p solana-program --precise 1.17.31
