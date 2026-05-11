/**
 * initFounderEscrow.js
 * ALWARD — Initialize Escrow Config for a Startup Founder
 *
 * Registers a startup's escrow config on-chain so investors can
 * immediately start depositing USDC into the milestone-gated vault.
 *
 * Usage:
 *   node scripts/initFounderEscrow.js <startup_id> <milestone_count> <funding_goal_usdc>
 *
 * Example:
 *   node scripts/initFounderEscrow.js STARTUP-001 4 50000
 */

const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl,
} = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

// ── Constants ────────────────────────────────────────────────────────────────
const ESCROW_PROGRAM_ID = new PublicKey(
  "c9ieYuJCWPuj1uhEN4VzNSQj68GHN1qw6tNvmsb7Eed"
);
// Circle's devnet USDC mint
const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);
const USDC_DECIMALS = 6;

// ── Borsh helpers ────────────────────────────────────────────────────────────
function encodeString(str) {
  const bytes = Buffer.from(str, "utf-8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function encodeU8(v) { return Buffer.from([v]); }

function encodeU64(v) {
  const buf = Buffer.alloc(8);
  const bigVal = typeof v === 'bigint' ? v : BigInt(Math.floor(v));
  buf.writeBigUInt64LE(bigVal, 0);
  return buf;
}

// Discriminator for initialize_founder_config
const INIT_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);

// ── Main ─────────────────────────────────────────────────────────────────────
async function initFounderEscrow(startupId, milestoneCount, fundingGoalUsdc) {
  console.log("\n🔐 ALWARD — Initialize Founder Escrow Config");
  console.log("━".repeat(50));
  console.log(`  Startup ID:      ${startupId}`);
  console.log(`  Milestones:      ${milestoneCount}`);
  console.log(`  Funding Goal:    $${fundingGoalUsdc.toLocaleString()} USDC`);
  console.log("━".repeat(50));

  // Load server wallet (founder's keypair)
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const walletPath =
    process.env.WALLET_PATH || path.join(homeDir, ".config/solana/id.json");

  let walletKeypair;
  if (!fs.existsSync(walletPath)) {
    console.log("⚠️ Wallet not found, generating temporary wallet for testing...");
    walletKeypair = Keypair.generate();
  } else {
    walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
    );
  }

  console.log(`\n👛 Founder wallet: ${walletKeypair.publicKey.toString()}`);

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  );

  // Check balance
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`💰 SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);

  if (balance < 0.01 * 1e9) {
    console.log("\n⚠️  Low SOL balance. Requesting airdrop...");
    try {
      const sig = await connection.requestAirdrop(walletKeypair.publicKey, 1e9);
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Airdrop received: 1 SOL");
    } catch {
      console.log("   Manual airdrop: solana airdrop 2 --url devnet");
    }
  }

  // Derive PDAs
  const [founderConfigPDA, founderConfigBump] =
    await PublicKey.findProgramAddress(
      [Buffer.from("founder_config"), Buffer.from(startupId)],
      ESCROW_PROGRAM_ID
    );

  const [escrowVaultPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("escrow_vault"), Buffer.from(startupId)],
    ESCROW_PROGRAM_ID
  );

  console.log(`\n📍 Founder Config PDA: ${founderConfigPDA.toString()}`);
  console.log(`📍 Escrow Vault PDA:   ${escrowVaultPDA.toString()}`);

  // Check if already initialized
  const existing = await connection.getAccountInfo(founderConfigPDA);
  if (existing) {
    console.log("\n✅ Escrow config already initialized for this startup.");
    console.log(`   Vault: ${escrowVaultPDA.toString()}`);
    return;
  }

  const goalLamports = BigInt(Math.floor(fundingGoalUsdc * 10 ** USDC_DECIMALS));

  // Build instruction data
  const data = Buffer.concat([
    INIT_DISCRIMINATOR,
    encodeString(startupId),
    encodeU8(milestoneCount),
    encodeU64(goalLamports),
  ]);

  const tx = new Transaction();

  // Create escrow vault ATA (owned by the config PDA)
  const escrowVaultATA = await getAssociatedTokenAddress(
    USDC_MINT,
    founderConfigPDA,
    true // allowOwnerOffCurve — PDA is the owner
  );

  const vaultInfo = await connection.getAccountInfo(escrowVaultATA);
  if (!vaultInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        walletKeypair.publicKey,
        escrowVaultATA,
        founderConfigPDA,
        USDC_MINT
      )
    );
    console.log("\n🏦 Creating escrow vault token account...");
  }

  // Add initialize_founder_config instruction
  tx.add({
    programId: ESCROW_PROGRAM_ID,
    keys: [
      { pubkey: founderConfigPDA, isSigner: false, isWritable: true },
      { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = walletKeypair.publicKey;
  tx.sign(walletKeypair);

  console.log("\n⏳ Sending transaction...");
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  const vaultExplorerUrl = `https://explorer.solana.com/address/${escrowVaultATA.toString()}?cluster=devnet`;

  console.log("\n" + "━".repeat(50));
  console.log("✅ Founder Escrow Config Initialized!");
  console.log(`   Startup ID:         ${startupId}`);
  console.log(`   Milestone Count:    ${milestoneCount}`);
  console.log(`   Funding Goal:       $${fundingGoalUsdc.toLocaleString()} USDC`);
  console.log(`   Config PDA:         ${founderConfigPDA.toString()}`);
  console.log(`   Vault Token Acct:   ${escrowVaultATA.toString()}`);
  console.log(`   Tx Signature:       ${signature}`);
  console.log(`\n🔍 Explorer:  ${explorerUrl}`);
  console.log(`🏦 Vault:     ${vaultExplorerUrl}`);
  console.log("\n✅ Investors can now deposit USDC via the investor platform.\n");
}

// ── CLI ───────────────────────────────────────────────────────────────────────
const [, , startupId, milestonesArg, goalArg] = process.argv;

if (!startupId) {
  console.error("Usage: node initFounderEscrow.js <startup_id> [milestone_count=4] [funding_goal_usdc=50000]");
  process.exit(1);
}

initFounderEscrow(
  startupId,
  parseInt(milestonesArg || "4", 10),
  parseFloat(goalArg || "50000")
).catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
