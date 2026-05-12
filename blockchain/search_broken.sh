#!/bin/bash
echo "Searching for edition 2024..."
grep -r 'edition = "2024"' /mnt/c/Users/user/ALWARD/blockchain
echo "Searching for block-buffer 0.12.0 in lock file..."
grep -B 1 '0.12.0' /mnt/c/Users/user/ALWARD/blockchain/Cargo.lock
