#!/bin/bash
cd /mnt/c/Users/user/ALWARD/blockchain/patches
echo "Fixing workspace inheritance in patches..."
find . -name "Cargo.toml" -exec sed -i 's/edition.workspace = true/edition = "2021"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/edition = "2024"/edition = "2021"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/rust-version.workspace = true/rust-version = "1.75"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/rust-version = "1.85"/rust-version = "1.75"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/license.workspace = true/license = "MIT OR Apache-2.0"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/repository.workspace = true/repository = "https:\/\/github.com\/toml-rs\/toml"/g' {} +
find . -name "Cargo.toml" -exec sed -i 's/include.workspace = true/include = ["**\/*"]/g' {} +
# Remove lints workspace inheritance
find . -name "Cargo.toml" -exec sed -i '/\[lints\]/,/workspace = true/d' {} +
echo "Done."
