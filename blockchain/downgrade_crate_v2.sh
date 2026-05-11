#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Downgrading block-buffer 0.12.0..."
cargo update -p block-buffer:0.12.0 --precise 0.10.4
