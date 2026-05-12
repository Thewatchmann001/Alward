#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Downgrading wit-bindgen..."
cargo update -p wit-bindgen --precise 0.17.0
