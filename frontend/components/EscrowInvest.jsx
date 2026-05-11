/**
 * EscrowInvest.jsx
 * ALWARD — On-Chain USDC Escrow Investment Component
 *
 * The investor connects their Phantom/Solflare wallet.
 * They choose an amount. They sign ONE transaction.
 * USDC moves from their wallet → escrow PDA vault on Solana Devnet.
 * A Solana Explorer link proves it happened.
 *
 * No Stripe. No server wallet. No fake minting.
 */

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, ExternalLink, CheckCircle, AlertTriangle,
  Lock, DollarSign, ChevronDown, Loader, ArrowRight,
} from "lucide-react";
import { useEscrow } from "../lib/useEscrow";
import toast from "react-hot-toast";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

export default function EscrowInvest({ startup, onSuccess }) {
  const { publicKey, connected } = useWallet();
  const { investInEscrow, getEscrowBalance, loading } = useEscrow();

  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [txResult, setTxResult] = useState(null);
  const [step, setStep] = useState("idle"); // idle | confirming | success | error

  const finalAmount = useCustom ? parseFloat(customAmount) || 0 : amount;

  useEffect(() => {
    if (startup?.startup_id) {
      getEscrowBalance(startup.startup_id).then((b) => setEscrowBalance(b.usdc));
    }
  }, [startup?.startup_id, txResult]);

  const handleInvest = async () => {
    if (!connected || !publicKey) {
      toast.error("Connect your Solana wallet first.");
      return;
    }
    if (finalAmount < 1) {
      toast.error("Minimum investment is $1 USDC.");
      return;
    }
    if (!startup?.startup_id) {
      toast.error("Startup data unavailable.");
      return;
    }

    setStep("confirming");
    const toastId = toast.loading("Awaiting wallet signature...");

    try {
      const result = await investInEscrow({
        startupId: startup.startup_id,
        amountUsdc: finalAmount,
      });

      toast.dismiss(toastId);
      toast.success("Investment confirmed on-chain!", { duration: 5000 });

      setTxResult(result);
      setStep("success");

      // Persist to backend (for dashboard UI sync — not for payment processing)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/investments/record-onchain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startup_id: startup.startup_id,
            investor_wallet: publicKey.toString(),
            amount_usdc: finalAmount,
            tx_signature: result.signature,
            investment_id: result.investmentId,
            escrow_vault: result.escrowVault,
          }),
        });
      } catch (_) {
        // Non-critical — on-chain record is the source of truth
      }

      if (onSuccess) onSuccess(result);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Transaction failed.");
      setStep("error");
    }
  };

  if (step === "success" && txResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[2rem] p-8 border border-emerald-500/30 bg-emerald-500/5 space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="text-emerald-400" size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Investment Confirmed On-Chain
            </p>
            <p className="text-2xl font-black italic tracking-tighter text-white">
              ${finalAmount.toLocaleString()} USDC Locked in Escrow
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Investment ID
            </span>
            <span className="text-slate-300">{txResult.investmentId}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Escrow Vault
            </span>
            <span className="text-slate-300 break-all">{txResult.escrowVault}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Transaction Signature
            </span>
            <span className="text-slate-300 break-all">{txResult.signature}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <a
            href={txResult.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink size={14} />
            Verify on Solana Explorer
          </a>
          <button
            onClick={() => { setStep("idle"); setTxResult(null); }}
            className="w-full py-4 rounded-xl border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
            Invest Again
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
          <Lock size={14} className="text-alward-blue mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Your USDC is locked in a milestone-gated escrow vault. Funds are
            released to the founder <strong className="text-white">only</strong> when
            a verified ground agent validates each milestone on-chain.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Escrow Balance Indicator */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-alward-blue" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Total in Escrow Vault
            </p>
            <p className="text-lg font-black italic text-white">
              ${escrowBalance.toLocaleString()} USDC
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Milestone-Locked
          </p>
          <p className="text-xs font-bold text-emerald-400">On-Chain</p>
        </div>
      </div>

      {/* Amount Selector */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Investment Amount (USDC)
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => { setAmount(a); setUseCustom(false); }}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                !useCustom && amount === a
                  ? "bg-alward-blue border-alward-blue text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              ${a.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="number"
            placeholder="Custom amount..."
            value={customAmount}
            onFocus={() => setUseCustom(true)}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setUseCustom(true);
            }}
            className={`w-full py-3 px-4 rounded-xl bg-white/5 border text-sm font-bold text-white placeholder-slate-600 outline-none transition-all ${
              useCustom
                ? "border-alward-blue shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                : "border-white/5 hover:border-white/10"
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            USDC
          </span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            You invest
          </span>
          <span className="font-black text-white">${finalAmount.toLocaleString()} USDC</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Destination
          </span>
          <span className="font-black text-alward-blue text-xs">Escrow Vault PDA</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Released when
          </span>
          <span className="font-black text-emerald-400 text-xs">Milestones Verified</span>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Network
          </span>
          <span className="font-black text-slate-300 text-xs">Solana Devnet</span>
        </div>
      </div>

      {/* Wallet + Invest Button */}
      {!connected ? (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
            Connect your wallet to invest
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-alward-blue !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest !py-4 !px-8" />
          </div>
        </div>
      ) : (
        <motion.button
          onClick={handleInvest}
          disabled={loading || finalAmount < 1 || step === "confirming"}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-5 rounded-xl bg-gradient-to-r from-alward-blue to-blue-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all"
        >
          {loading || step === "confirming" ? (
            <>
              <Loader size={16} className="animate-spin" />
              Awaiting Wallet Signature...
            </>
          ) : (
            <>
              <Zap size={16} />
              Invest ${finalAmount.toLocaleString()} USDC On-Chain
              <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      )}

      {/* Trust Note */}
      <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-600">
        Your USDC is locked on Solana — not held by ALWARD.
        Released only upon verified ground-agent attestation.
      </p>
    </div>
  );
}
