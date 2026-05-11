#!/bin/bash
export PATH=$PATH:/home/watchmann001/.local/share/solana/install/active_release/bin
echo "Milestone Escrow ID:"
solana-keygen pubkey /mnt/c/Users/user/ALWARD/blockchain/target/deploy/milestone_escrow-keypair.json
echo "Startup Registry ID:"
solana-keygen pubkey /mnt/c/Users/user/ALWARD/blockchain/target/deploy/startup_registry-keypair.json
