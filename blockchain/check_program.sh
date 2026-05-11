#!/bin/bash
export PATH=$PATH:/home/watchmann001/.local/share/solana/install/active_release/bin
echo "Checking milestone_escrow on devnet..."
solana program show --url devnet c9ieYuJCWPuj1uhEN4VzNSQj68GHN1qw6tNvmsb7Eed
