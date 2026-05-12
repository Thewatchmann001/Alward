#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Vendoring dependencies..."
cargo vendor
