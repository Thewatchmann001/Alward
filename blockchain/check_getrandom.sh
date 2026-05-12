#!/bin/bash
export PATH=$PATH:/home/watchmann001/.cargo/bin
cd /mnt/c/Users/user/ALWARD/blockchain
echo "Checking getrandom 0.3.4 tree..."
cargo tree -i getrandom:0.3.4
