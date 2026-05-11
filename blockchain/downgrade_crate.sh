#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Downgrading block-buffer..."
cargo update -p block-buffer --precise 0.10.4
