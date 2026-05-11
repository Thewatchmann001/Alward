/**
 * ground-agent.jsx
 * ALWARD — Ground Agent Field Validation Dashboard
 *
 * Ground agents connect their Solana wallet and submit on-chain
 * attestations for startup milestones. Their wallet address,
 * confidence score, and evidence hash are permanently recorded on Solana.
 *
 * This is the core of the "Triangulation of Truth" — the only
 * mechanism by which USDC flows from escrow to a startup founder.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, MapPin, Clock, CheckCircle, AlertCircle,
  ExternalLink, Globe, Zap, Lock, BarChart2, Users,
  ChevronRight, Database, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";
import GroundAgentValidate from "../components/GroundAgentValidate";

export default function GroundAgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { publicKey } = useWallet();

  const [pendingStartups, setPendingStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, validated: 0, released: 0 });

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "enumerator" && user.role !== "admin") {
      toast.error("Ground Agent role required.");
      router.push("/");
      return;
    }
    fetchStartups();
  }, [user]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/startups`);
      if (res.ok) {
        const data = await res.json();
        setPendingStartups(data || []);
        setStats({
          total: data.length,
          validated: data.filter((s) => s.milestones_validated > 0).length,
          released: data.filter((s) => s.total_released > 0).length,
        });
      }
    } catch (e) {
      toast.error("Failed to load startups.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (startupId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/milestones/startup/${startupId}`);
      if (res.ok) {
        const data = await res.json();
        setMilestones(data || []);
      } else {
        setMilestones([]);
      }
    } catch {
      setMilestones([]);
    }
  };

  const handleSelectStartup = (startup) => {
    setSelectedStartup(startup);
    fetchMilestones(startup.id);
  };

  // ── Detail / Validation View ───────────────────────────────────────────────
  if (selectedStartup) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
        </div>

        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Logo size="medium" />
            <button
              onClick={() => { setSelectedStartup(null); setMilestones([]); }}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              ← All Assignments
            </button>
          </div>
        </nav>

        <main className="relative z-10 max-w-6xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Startup Info Panel */}
            <div className="space-y-6">
              {/* Header */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">
                  Field Assignment
                </p>
                <h1 className="text-4xl font-black italic tracking-tighter mb-3">
                  {selectedStartup.name}
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-emerald-400" />
                    {selectedStartup.country}
                  </span>
                  <span>{selectedStartup.sector}</span>
                </div>
              </motion.div>

              {/* Escrow Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    In Escrow
                  </p>
                  <p className="text-2xl font-black italic text-white">
                    ${(selectedStartup.total_investments || 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                    USDC Locked
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Milestones
                  </p>
                  <p className="text-2xl font-black italic text-white">
                    {selectedStartup.milestones_validated || 0}
                    <span className="text-slate-600">/{selectedStartup.milestone_count || 4}</span>
                  </p>
                  <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                    Validated
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Mission
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedStartup.mission || selectedStartup.description}
                </p>
              </div>

              {/* On-chain registration proof */}
              {selectedStartup.transaction_signature && (
                <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={14} className="text-blue-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                      On-Chain Registration
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 break-all mb-3">
                    {selectedStartup.transaction_signature}
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${selectedStartup.transaction_signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink size={12} />
                    View on Explorer
                  </a>
                </div>
              )}

              {/* Agent Protocol */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Ground Agent Protocol
                </p>
                {[
                  "Physically verify the startup's claimed milestone",
                  "Upload photo/document evidence to IPFS",
                  "Paste the IPFS CID as your evidence hash",
                  "Set your confidence score (0–100)",
                  "Sign the on-chain attestation with your wallet",
                  "Trigger the USDC tranche release to founder",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-slate-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Panel */}
            <div>
              <div className="rounded-[2rem] bg-white/[0.03] border border-white/5 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Shield size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Ground Agent Attestation
                    </p>
                    <p className="text-sm font-black text-white">On-Chain Validation</p>
                  </div>
                </div>
                <GroundAgentValidate
                  startup={selectedStartup}
                  milestones={milestones}
                  onValidated={() => {
                    fetchStartups();
                    fetchMilestones(selectedStartup.id);
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Assignment List ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-4">
            {publicKey && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-400">
                  {publicKey.toString().slice(0, 12)}...
                </span>
              </div>
            )}
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Agent</p>
              <p className="text-xs font-bold text-white">{user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-2">
            Triangulation Layer
          </p>
          <h1 className="text-5xl font-black italic tracking-tighter mb-4">
            Ground Agent HQ
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Your on-chain attestations are the only mechanism by which escrowed USDC
            flows to startup founders. Your wallet. Your signature. Immutable.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "Assigned Startups", value: stats.total, color: "text-white" },
            { label: "Validations Done", value: stats.validated, color: "text-emerald-400" },
            { label: "Tranches Released", value: stats.released, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                {label}
              </p>
              <p className={`text-3xl font-black italic ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Startup Assignments */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Active Assignments
          </p>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : pendingStartups.length === 0 ? (
            <div className="text-center py-24 text-slate-600">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                No active assignments
              </p>
            </div>
          ) : (
            pendingStartups.map((startup, i) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelectStartup(startup)}
                className="group flex items-center gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 hover:bg-white/5 cursor-pointer transition-all"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-500 p-[1px] flex-shrink-0">
                  <div className="w-full h-full rounded-xl bg-[#020617] flex items-center justify-center font-black italic text-sm text-white">
                    {startup.name?.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black italic tracking-tight text-white group-hover:text-emerald-400 transition-colors mb-1">
                    {startup.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                      {startup.sector}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
                      <Globe size={10} className="text-emerald-400" />
                      {startup.country}
                    </span>
                  </div>
                </div>

                {/* Escrow Amount */}
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                    In Escrow
                  </p>
                  <p className="text-sm font-black text-white">
                    ${(startup.total_investments || 0).toLocaleString()} USDC
                  </p>
                </div>

                {/* Milestone Badge */}
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                    Milestones
                  </p>
                  <p className="text-sm font-black text-emerald-400">
                    {startup.milestones_validated || 0}/{startup.milestone_count || 4}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="text-slate-700 group-hover:text-emerald-400 transition-colors flex-shrink-0"
                />
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
