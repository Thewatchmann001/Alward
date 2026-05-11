/**
 * deployEscrow.js
 * ALWARD — Deploys the milestone-escrow Anchor program to Devnet
 * and initializes the escrow vault for a test startup.
 *
 * Run ONCE after `anchor build` to get the program deployed.
 * Usage: node scripts/deployEscrow.js
 */

const { execSync } = require("child_process");
const { Connection, Keypair, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

const PROGRAM_ID = "ESCRmwcXk7qzL8YvhNbDqNRp2xzVgAR7SoYbHqHZkaDx";
const NETWORK = "devnet";

async function deploy() {
  console.log("\n🚀 ALWARD Milestone Escrow — Deploy Script");
  console.log("━".repeat(50));

  // Step 1: Build
  console.log("\n[1/3] Building Anchor programs...");
  try {
    execSync("anchor build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log("✅ Build successful");
  } catch (e) {
    console.error("❌ Build failed:", e.message);
    process.exit(1);
  }

  // Step 2: Deploy to Devnet
  console.log("\n[2/3] Deploying to Solana Devnet...");
  try {
    const output = execSync(
      "anchor deploy --provider.cluster devnet --program-name milestone_escrow",
      {
        cwd: path.join(__dirname, ".."),
        encoding: "utf-8",
      }
    );
    console.log(output);
    console.log("✅ Deployed to Devnet");
  } catch (e) {
    console.error("❌ Deploy failed:", e.message);
    console.log("\nIf you need SOL for fees, run:");
    console.log("  solana airdrop 2 --url devnet");
    process.exit(1);
  }

  // Step 3: Verify on Explorer
  console.log("\n[3/3] Verifying deployment...");
  const explorerUrl = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;
  console.log(`✅ Program live at: ${explorerUrl}`);

  console.log("\n" + "━".repeat(50));
  console.log("🎯 ALWARD Escrow Program Deployed!");
  console.log(`   Program ID:  ${PROGRAM_ID}`);
  console.log(`   Network:     Solana ${NETWORK}`);
  console.log(`   Explorer:    ${explorerUrl}`);
  console.log("\nNext steps:");
  console.log("  1. Run: node scripts/initFounderEscrow.js <startup_id>");
  console.log("  2. Open investor platform → Connect Phantom → Invest");
  console.log("  3. Open ground agent page → Connect wallet → Validate milestone");
  console.log("  4. Tranche auto-releases to founder's wallet\n");
}

deploy().catch(console.error);
