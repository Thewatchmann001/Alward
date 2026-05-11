/**
 * GroundAgentValidate.jsx
 * ALWARD — Ground Agent Milestone Validation Panel
 *
 * A ground agent (physical verifier) connects their wallet and
 * submits an on-chain attestation for a startup milestone.
 * Their wallet address is permanently recorded on Solana.
 * Their confidence score and evidence hash are immutable.
 *
 * This is the CORE of the "Triangulation of Truth" — the only
 * way USDC flows from escrow to founder is through this screen.
 */

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle, MapPin, FileText, Zap,
  Loader, ExternalLink, AlertTriangle, Camera, Hash,
} from "lucide-react";
import { useEscrow } from "../lib/useEscrow";
import toast from "react-hot-toast";

const CONFIDENCE_LABELS = {
  90: { label: "High Confidence", color: "text-emerald-400" },
  70: { label: "Moderate Confidence", color: "text-yellow-400" },
  50: { label: "Low Confidence", color: "text-orange-400" },
};

export default function GroundAgentValidate({ startup, milestones, onValidated }) {
  const { publicKey, connected } = useWallet();
  const { agentApproveMilestone, releaseTranche, loading } = useEscrow();

  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(85);
  const [evidenceHash, setEvidenceHash] = useState("");
  const [notes, setNotes] = useState("");
  const [txResult, setTxResult] = useState(null);
  const [step, setStep] = useState("form"); // form | success

  const getConfidenceLabel = (score) => {
    if (score >= 85) return { label: "High Confidence", color: "text-emerald-400" };
    if (score >= 65) return { label: "Moderate Confidence", color: "text-yellow-400" };
    return { label: "Low Confidence", color: "text-orange-400" };
  };

  const handleValidate = async () => {
    if (!connected) { toast.error("Connect your ground agent wallet."); return; }
    if (selectedMilestone === null) { toast.error("Select a milestone to validate."); return; }
    if (!evidenceHash.trim()) { toast.error("Evidence hash / IPFS CID is required."); return; }
    if (!startup?.startup_id) { toast.error("Startup data missing."); return; }

    const toastId = toast.loading("Submitting attestation to Solana...");
    try {
      const result = await agentApproveMilestone({
        startupId: startup.startup_id,
        milestoneIndex: selectedMilestone,
        confidenceScore: Math.round(confidenceScore),
        evidenceHash: evidenceHash.trim(),
      });

      toast.dismiss(toastId);
      toast.success("Milestone validated on-chain!", { duration: 5000 });
      setTxResult(result);
      setStep("success");

      // Sync to backend for dashboard display
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/api/milestones/validate-onchain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startup_id: startup.startup_id,
            milestone_index: selectedMilestone,
            agent_wallet: publicKey.toString(),
            confidence_score: Math.round(confidenceScore),
            evidence_hash: evidenceHash.trim(),
            notes,
            tx_signature: result.signature,
          }),
        });
      } catch (_) {}

      if (onValidated) onValidated(result);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Validation failed.");
    }
  };

  const handleReleaseTranche = async () => {
    if (!startup?.founder_wallet_address) {
      toast.error("Founder wallet address not found.");
      return;
    }
    const toastId = toast.loading("Releasing tranche to founder...");
    try {
      const result = await releaseTranche({
        startupId: startup.startup_id,
        milestoneIndex: selectedMilestone,
        founderAddress: startup.founder_wallet_address,
      });
      toast.dismiss(toastId);
      toast.success("Tranche released! Funds sent to founder.", { duration: 5000 });
      setTxResult(result);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Release failed.");
    }
  };

  if (step === "success" && txResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Header */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="text-emerald-400" size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
              Attestation Recorded On-Chain
            </p>
            <p className="text-xl font-black italic tracking-tighter text-white">
              Milestone {selectedMilestone} Validated
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Agent: <span className="font-mono text-slate-300">{publicKey?.toString().slice(0, 12)}...</span>
            </p>
          </div>
        </div>

        {/* TX Details */}
        <div className="space-y-3 p-5 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            On-Chain Record
          </p>
          <div className="font-mono text-xs text-slate-300 break-all">
            {txResult.signature}
          </div>
        </div>

        {/* Release Tranche */}
        <div className="p-5 rounded-xl border border-alward-blue/20 bg-alward-blue/5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-alward-blue" />
            <p className="text-[10px] font-black uppercase tracking-widest text-alward-blue">
              Release USDC Tranche to Founder
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Since this milestone is now validated, you can trigger the proportional USDC
            release from escrow to the founder's wallet. This is permissionless — anyone can trigger it.
          </p>
          <button
            onClick={handleReleaseTranche}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-alward-blue text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
            Release Tranche Now
          </button>
        </div>

        <a
          href={txResult.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-xl border border-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={14} />
          View on Solana Explorer
        </a>

        <button
          onClick={() => { setStep("form"); setTxResult(null); setSelectedMilestone(null); setEvidenceHash(""); }}
          className="w-full py-3 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
        >
          Validate Another Milestone
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Identity */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
          Ground Agent Identity
        </p>
        {connected ? (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-sm text-white">
              {publicKey?.toString().slice(0, 20)}...
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Active
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Your wallet address is permanently recorded as the attestation authority.
            </p>
            <WalletMultiButton className="!bg-alward-blue !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest" />
          </div>
        )}
      </div>

      {/* Milestone Selector */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Select Milestone to Validate
        </p>
        <div className="space-y-2">
          {milestones && milestones.length > 0 ? (
            milestones.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMilestone(idx)}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  selectedMilestone === idx
                    ? "bg-alward-blue/10 border-alward-blue text-white"
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Milestone {idx + 1}
                    </p>
                    <p className="text-sm font-bold">{m.title || m.description || `Milestone ${idx + 1}`}</p>
                  </div>
                  {selectedMilestone === idx && (
                    <CheckCircle size={16} className="text-alward-blue flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          ) : (
            // Generic milestone selectors if no milestone data passed
            [0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMilestone(idx)}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  selectedMilestone === idx
                    ? "bg-alward-blue/10 border-alward-blue text-white"
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Milestone {idx + 1}</p>
                  {selectedMilestone === idx && (
                    <CheckCircle size={16} className="text-alward-blue" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Confidence Score
          </p>
          <span className={`text-sm font-black ${getConfidenceLabel(confidenceScore).color}`}>
            {Math.round(confidenceScore)} — {getConfidenceLabel(confidenceScore).label}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={confidenceScore}
          onChange={(e) => setConfidenceScore(parseInt(e.target.value))}
          className="w-full accent-alward-blue h-2 rounded-full cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
          <span>0 — No Evidence</span>
          <span>50 — Partial</span>
          <span>100 — Verified</span>
        </div>
      </div>

      {/* Evidence Hash */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Evidence Hash (IPFS CID or SHA256)
        </p>
        <div className="relative">
          <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
            value={evidenceHash}
            onChange={(e) => setEvidenceHash(e.target.value)}
            className="w-full py-3 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-alward-blue transition-colors"
          />
        </div>
        <p className="text-[9px] text-slate-600 uppercase tracking-widest">
          Upload photos/docs to IPFS and paste the CID here. This is immutable proof.
        </p>
      </div>

      {/* Notes (off-chain, for backend only) */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Field Notes (Off-Chain)
        </p>
        <textarea
          rows={3}
          placeholder="Physical verification notes, observations, anomalies..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder-slate-600 outline-none focus:border-alward-blue resize-none transition-colors"
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-amber-400/80 leading-relaxed">
          Your attestation is <strong className="text-amber-400">permanent and immutable</strong> on Solana.
          Your wallet address will be recorded as the verifier. False attestations
          will be publicly visible on-chain.
        </p>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleValidate}
        disabled={loading || !connected || selectedMilestone === null || !evidenceHash.trim()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all"
      >
        {loading ? (
          <><Loader size={16} className="animate-spin" /> Submitting Attestation...</>
        ) : (
          <><Shield size={16} /> Submit Ground Agent Attestation</>
        )}
      </motion.button>
    </div>
  );
}
