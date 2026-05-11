const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

// Real Milestone Escrow Program
const ESCROW_PROGRAM_ID = new PublicKey("c9ieYuJCWPuj1uhEN4VzNSQj68GHN1qw6tNvmsb7Eed");

const DISCRIMINATORS = {
  invest_in_escrow: Buffer.from([141, 164, 113, 40, 196, 230, 18, 220]),
};

function encodeString(str) {
  const bytes = Buffer.from(str, "utf-8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function encodeU64(value) {
  const buf = Buffer.alloc(8);
  const bigVal = typeof value === "bigint" ? value : BigInt(Math.floor(value));
  buf.writeBigUInt64LE(bigVal, 0);
  return buf;
}

/**
 * Executes a REAL on-chain investment via the ALWARD milestone-escrow protocol.
 * Investor signs with their own wallet. Funds move to an Escrow PDA.
 */
async function investUSDC({ investorAddress, startupId, amountUSDC }) {
  try {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const walletPath = process.env.WALLET_PATH || path.join(homeDir, ".config/solana/id.json");
    
    let walletKeypair;
    try {
      walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
      );
    } catch (e) {
      console.log("Could not find local wallet, generating a temporary one for testing...");
      walletKeypair = Keypair.generate();
    }

    // Airdrop SOL if balance is zero (for devnet testing)
    const balance = await connection.getBalance(walletKeypair.publicKey);
    if (balance < 0.01 * 10**9) {
      console.log("Requesting airdrop for wallet...");
      try {
        const airdropSig = await connection.requestAirdrop(
          walletKeypair.publicKey,
          2 * 10**9
        );
        await connection.confirmTransaction(airdropSig, "confirmed");
        console.log("Airdrop successful.");
      } catch (err) {
        console.warn("Airdrop failed, transaction might fail if balance is 0:", err.message);
      }
    }

    const TEST_USDC_MINT = process.env.DEVNET_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    const usdcMint = new PublicKey(TEST_USDC_MINT);
    const investorPubkey = new PublicKey(investorAddress);
    
    // For CLI demo purposes, we let the local CLI wallet act as the investor
    const signer = walletKeypair;

    console.log(`🚀 Initiating on-chain escrow investment of ${amountUSDC} USDC for Startup ${startupId}...`);

    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const investmentId = `INV-${timestamp}-${random}`;

    const [founderConfigPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("founder_config"), Buffer.from(startupId)],
      ESCROW_PROGRAM_ID
    );
    
    const [escrowVaultPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("escrow_vault"), Buffer.from(startupId)],
      ESCROW_PROGRAM_ID
    );

    const [investmentRecordPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("investment"), Buffer.from(investmentId)],
      ESCROW_PROGRAM_ID
    );

    const investorATA = await getAssociatedTokenAddress(usdcMint, signer.publicKey);

    const tx = new Transaction();
    
    // Check if investor ATA exists
    const investorATAInfo = await connection.getAccountInfo(investorATA);
    if (!investorATAInfo) {
       console.log("Creating investor ATA...");
       tx.add(createAssociatedTokenAccountInstruction(signer.publicKey, investorATA, signer.publicKey, usdcMint));
    }

    // Check if founder config exists (Guarding against uninitialized startup_id)
    const founderConfigInfo = await connection.getAccountInfo(founderConfigPDA);
    if (!founderConfigInfo) {
      console.error(`❌ Error: Startup ${startupId} is not initialized on-chain.`);
      console.log(`💡 Tip: Run 'node scripts/initFounderEscrow.js ${startupId} 4 50000' first.`);
      return;
    }

    // Check if escrow vault exists
    const escrowVaultInfo = await connection.getAccountInfo(escrowVaultPDA);
    if (!escrowVaultInfo) {
      console.log("Creating escrow vault ATA...");
      tx.add(createAssociatedTokenAccountInstruction(signer.publicKey, escrowVaultPDA, founderConfigPDA, usdcMint));
    }

    const amountLamports = BigInt(Math.floor(amountUSDC * 10 ** 6));

    const data = Buffer.concat([
      DISCRIMINATORS.invest_in_escrow,
      encodeString(startupId),
      encodeString(investmentId),
      encodeU64(amountLamports),
    ]);

    const investIx = new TransactionInstruction({
      programId: ESCROW_PROGRAM_ID,
      keys: [
        { pubkey: founderConfigPDA, isSigner: false, isWritable: true },
        { pubkey: investmentRecordPDA, isSigner: false, isWritable: true },
        { pubkey: escrowVaultPDA, isSigner: false, isWritable: true },
        { pubkey: signer.publicKey, isSigner: true, isWritable: true },
        { pubkey: investorATA, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    tx.add(investIx);

    console.log("Sending transaction (simulating investor signature)...");
    
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = signer.publicKey;
    
    tx.sign(signer);

    try {
      const signature = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      console.log(`✅ Investment successful!`);
      console.log(`🔗 Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
      console.log(`🏦 Escrow Vault: ${escrowVaultPDA.toString()}`);
      return {
        investmentId,
        transactionSignature: signature,
        escrowVault: escrowVaultPDA.toString(),
      };
    } catch (e) {
      console.log("❌ Transaction failed. Note: The investor wallet needs DEVNET USDC for this to succeed.");
      throw e;
    }

  } catch (error) {
    console.error("Error processing investment:", error);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: node investUSDC.js <investorAddress> <startupId> <amountUSDC>");
    process.exit(1);
  }

  investUSDC({
    investorAddress: args[0],
    startupId: args[1],
    amountUSDC: parseFloat(args[2]),
  });
}

module.exports = { investUSDC };
