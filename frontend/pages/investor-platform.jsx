/**
 * investor-platform.jsx
 * ALWARD — Investor Intelligence Platform
 *
 * Investors browse startups and invest via the milestone-gated
 * USDC escrow program. No Stripe. Wallet signs real SPL transfers.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Shield, TrendingUp, Search, Filter,
  ChevronRight, Globe, ArrowLeft, Zap, Lock,
  ExternalLink, BarChart2, Users, DollarSign,
  Target, CheckCircle, Copy
} from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";
import EscrowInvest from "../components/EscrowInvest";

export default function InvestorPlatformPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { publicKey } = useWallet();

  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showInvest, setShowInvest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) { router.push("/login"); return; }
    fetchStartups();
  }, [user]);

  useEffect(() => {
    if (selectedStartup) {
      fetchProposals(selectedStartup.id);
    }
  }, [selectedStartup]);

  const fetchProposals = async (startupId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/proposals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        // filter by startup ID since the endpoint returns all non-draft proposals
        setProposals(data.filter(p => p.startup_id === startupId));
      }
    } catch (e) {
      toast.error("Failed to load proposals.");
    }
  };

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/startups`);
      if (res.ok) {
        const data = await res.json();
        setStartups(data || []);
      }
    } catch (e) {
      toast.error("Failed to load startup intelligence.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = startups.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.sector?.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted || !user) return null;

  // ── Invest View ────────────────────────────────────────────────────────────
  if (showInvest && selectedStartup) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Logo size="medium" />
            <button
              onClick={() => setShowInvest(false)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </nav>

        <main className="relative z-10 max-w-5xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Startup Summary */}
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">
                  Truth Node
                </p>
                <h1 className="text-4xl font-black italic tracking-tighter mb-2">
                  {selectedStartup.name}
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-emerald-400" />
                    {selectedStartup.country}
                  </span>
                  <span>{selectedStartup.sector}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Escrow Mechanics
                </p>
                {[
                  {
                    label: "Your USDC goes to",
                    value: "Escrow Vault PDA",
                    color: "text-blue-400",
                  },
                  {
                    label: "Released when",
                    value: "Ground agent validates milestone",
                    color: "text-emerald-400",
                  },
                  {
                    label: "Refundable if",
                    value: "Startup hasn't started",
                    color: "text-amber-400",
                  },
                  {
                    label: "Proof",
                    value: "Solana Explorer — immutable",
                    color: "text-slate-300",
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                      {row.label}
                    </span>
                    <span className={`text-xs font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <Lock size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  This is a real on-chain transaction on Solana Devnet. Your wallet
                  (Phantom / Solflare) will prompt you to sign. USDC leaves your
                  wallet and is locked in a program-controlled vault until milestones
                  are verified by independent ground agents.
                </p>
              </div>
            </div>

            {/* Escrow Invest Panel */}
            <div className="rounded-[2rem] bg-white/[0.03] border border-white/5 p-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">
                On-Chain Investment
              </p>
              <EscrowInvest
                startup={selectedStartup}
                onSuccess={(result) => {
                  toast.success("Investment locked in escrow!");
                  setTimeout(() => {
                    setShowInvest(false);
                    setSelectedStartup(null);
                  }, 3000);
                }}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Startup Detail View ────────────────────────────────────────────────────
  if (selectedStartup && !showInvest) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans">
        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Logo size="medium" />
            <button
              onClick={() => setSelectedStartup(null)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> All Startups
            </button>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-8 py-12 space-y-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">
              Primary Truth Node
            </p>
            <h1 className="text-5xl font-black italic tracking-tighter mb-4">
              {selectedStartup.name}
            </h1>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Globe size={12} className="text-emerald-400" />
                {selectedStartup.country}
              </span>
              <span>{selectedStartup.sector}</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedStartup.wallet_address ? `${selectedStartup.wallet_address.substring(0, 6)}...${selectedStartup.wallet_address.substring(selectedStartup.wallet_address.length - 6)}` : "No Wallet Attached"}
                </span>
                {selectedStartup.wallet_address && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedStartup.wallet_address);
                      toast.success("Startup address copied!");
                    }}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { label: "Funding Goal", value: `$${(selectedStartup.funding_goal || 0).toLocaleString()}`, icon: DollarSign },
              { label: "Total Raised", value: `$${(selectedStartup.total_investments || 0).toLocaleString()}`, icon: TrendingUp },
              { label: "Team Size", value: selectedStartup.team_size || "—", icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <Icon size={16} className="text-slate-600 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                <p className="text-2xl font-black italic">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Mission</p>
            <p className="text-slate-300 leading-relaxed">{selectedStartup.mission || selectedStartup.description}</p>
          </div>

          {selectedStartup.risk_score != null && (
            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
                    Alward Risk Index
                  </p>
                  <p className="text-3xl font-black italic">
                    {(100 - selectedStartup.risk_score).toFixed(0)}/100
                  </p>
                </div>
                <BarChart2 size={32} className="text-blue-400/30" />
              </div>
            </div>
          )}

          {/* Proposals Section */}
          <div className="mt-12">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
              <Target size={20} className="text-emerald-400" />
              Investment Proposals
            </h2>
            {proposals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                No active proposals.
              </div>
            ) : (
              <div className="space-y-6">
                {proposals.map(p => (
                  <div key={p.id} className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border ${
                          p.status === 'locked' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {p.status.replace('_', ' ')}
                        </span>
                        <h3 className="text-2xl font-black italic mt-4 text-white">Version {p.version_number}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Funding Goal</p>
                        <p className="text-2xl font-black italic text-emerald-400">${p.funding_goal.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {p.status === 'pending_admin' && (
                      <motion.button
                        onClick={async () => {
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                            const res = await fetch(`${apiUrl}/api/proposals/${p.id}/approve`, {
                              method: "PUT",
                              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                            });
                            if (res.ok) {
                              toast.success("Proposal Approved and Locked!");
                              fetchProposals(selectedStartup.id);
                            } else {
                              toast.error("Approval failed");
                            }
                          } catch (e) {
                            toast.error("Network error");
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mb-6 py-4 rounded-xl bg-emerald-500 text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-colors"
                      >
                        <CheckCircle size={18} />
                        Approve Proposal Version
                      </motion.button>
                    )}

                    {p.status === 'locked' && (
                      <motion.button
                        onClick={() => setShowInvest(true)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6"
                      >
                        <Shield size={18} />
                        Invest via Milestone Escrow
                        <ChevronRight size={16} />
                      </motion.button>
                    )}

                    <div className="border-t border-white/10 pt-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Milestones</p>
                      <div className="space-y-4">
                        {p.milestones?.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                              <p className="font-bold text-white text-sm">{m.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                            </div>
                            <p className="text-emerald-400 font-bold">${m.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Main Marketplace ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Investor
              </p>
              <p className="text-xs font-bold text-white">
                {user.full_name || user.email}
              </p>
            </div>
            <button
              onClick={() => router.push("/investor-dashboard")}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 px-3 py-1.5 rounded-lg"
            >
              My Dashboard
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              <LogOut size={14} /> Exit
            </button>
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
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">
            Elite Investment Pool
          </p>
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4">
            Verified Startups
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Every startup below is on-chain registered. Invest via milestone-gated
            escrow — your USDC only moves when ground agents verify execution.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-8 max-w-lg">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search by name, sector, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Startup Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <Shield size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              No startups match your search
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filtered.map((startup, i) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedStartup(startup)}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 hover:bg-white/5 cursor-pointer transition-all"
              >
                {/* Startup Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-[1px]">
                    <div className="w-full h-full rounded-xl bg-[#020617] flex items-center justify-center font-black italic text-xs text-white">
                      {startup.name?.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    On-Chain
                  </span>
                </div>

                <h3 className="text-lg font-black italic tracking-tight text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {startup.name}
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {startup.sector}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
                    <Globe size={10} className="text-emerald-400" />
                    {startup.country}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                  {startup.mission || startup.description}
                </p>

                {/* Metrics */}
                <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                      Goal
                    </p>
                    <p className="text-sm font-black text-white">
                      ${(startup.funding_goal || 0).toLocaleString()}
                    </p>
                  </div>
                  {startup.risk_score != null && (
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                        Trust Index
                      </p>
                      <p className="text-sm font-black text-blue-400">
                        {(100 - startup.risk_score).toFixed(0)}/100
                      </p>
                    </div>
                  )}
                  <ChevronRight
                    size={16}
                    className="text-slate-700 group-hover:text-blue-400 transition-colors"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
