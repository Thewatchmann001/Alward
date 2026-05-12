/**
 * startup-marketplace.jsx
 * ALWARD — Startup Marketplace
 * Founders land here after onboarding. Shows all registered startups with
 * trust scores. If their startup is still pending, they see a notification
 * banner and cannot yet access the full dashboard.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Globe, TrendingUp, Clock, CheckCircle, Bell,
  ArrowRight, Search, Lock, Star, Zap, ExternalLink,
  ChevronRight, BarChart2, Users, DollarSign, Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Compute a display trust score from credibility_score + risk_score
function getTrustScore(startup) {
  if (startup.trust_score != null) return Math.round(startup.trust_score);
  if (startup.credibility_score != null && startup.risk_score != null) {
    // credibility (0-100 good) + inverted risk (100=worst, so 100-risk = good)
    return Math.round((startup.credibility_score * 0.5) + ((100 - startup.risk_score) * 0.5));
  }
  if (startup.credibility_score != null) return Math.round(startup.credibility_score);
  if (startup.risk_score != null) return Math.round(100 - startup.risk_score);
  // fallback: derive from status
  return startup.status === "approved" ? 72 : 45;
}

function getTrustColor(score) {
  if (score >= 75) return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" };
  if (score >= 50) return { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" };
  if (score >= 30) return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" };
  return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" };
}

function getTrustLabel(score) {
  if (score >= 75) return "High Trust";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Building";
  return "Unverified";
}

export default function StartupMarketplace() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [startups, setStartups] = useState([]);
  const [myStartup, setMyStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | approved | pending
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchAll();
  }, [isAuthenticated, user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [startupsRes, myRes] = await Promise.allSettled([
        fetch(`${API}/api/startups`),
        user?.id ? fetch(`${API}/api/startups/by-founder/${user.id}`) : Promise.resolve(null),
      ]);

      if (startupsRes.status === "fulfilled" && startupsRes.value.ok) {
        const data = await startupsRes.value.json();
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.startups) ? data.startups
          : [];
        setStartups(list);
      }

      if (myRes.status === "fulfilled" && myRes.value && myRes.value.ok) {
        const mine = await myRes.value.json();
        setMyStartup(mine);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = (Array.isArray(startups) ? startups : []).filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.sector?.toLowerCase().includes(search.toLowerCase()) ||
      s.country?.toLowerCase().includes(search.toLowerCase());
    if (filter === "approved") return matchSearch && s.status === "approved";
    if (filter === "pending") return matchSearch && s.status !== "approved";
    return matchSearch;
  });

  const isPending = myStartup && myStartup.status !== "approved";
  const isApproved = myStartup && myStartup.status === "approved";

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-4">
            {isApproved && (
              <button
                onClick={() => router.push("/startup-dashboard")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
              >
                <Zap size={12} /> My Dashboard
              </button>
            )}
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Founder</p>
              <p className="text-xs font-bold text-white">{user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Pending Approval Banner */}
      <AnimatePresence>
        {isPending && showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-40 bg-amber-500/10 border-b border-amber-500/30 px-8 py-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Bell size={16} className="text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-400">
                    🎉 <span className="text-white">{myStartup?.name}</span> has been submitted!
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Our team is reviewing your startup. You'll be notified once approved — then you can access your full dashboard to set milestones and funding goals.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 text-slate-600 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-2">
            ALWARD Protocol
          </p>
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4">
            Startup Marketplace
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Every startup below is registered on the ALWARD protocol. Trust scores are computed from
            credibility signals, ground agent verifications, and on-chain activity.
          </p>
        </motion.div>

        {/* My Startup Spotlight (if exists) */}
        {myStartup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 rounded-2xl border bg-white/[0.02]"
            style={{
              borderColor: isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
            }}
          >
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-[1px]">
                  <div className="w-full h-full rounded-xl bg-[#020617] flex items-center justify-center font-black italic text-sm text-white">
                    {myStartup.name?.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Your Startup</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                      isApproved
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {isApproved ? '✓ Verified' : '⏳ Pending Review'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black italic text-white">{myStartup.name}</h2>
                  <p className="text-xs text-slate-500">{myStartup.sector} · {myStartup.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Trust Score</p>
                  <p className={`text-2xl font-black italic ${getTrustColor(getTrustScore(myStartup)).text}`}>
                    {getTrustScore(myStartup)}/100
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Goal</p>
                  <p className="text-2xl font-black italic">${(myStartup.funding_goal || 0).toLocaleString()}</p>
                </div>
                {isApproved ? (
                  <button
                    onClick={() => router.push("/startup-dashboard")}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    <Zap size={14} /> Open Dashboard <ArrowRight size={12} />
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => router.push("/startup-onboarding")}
                      className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      <Edit size={14} /> Edit Profile
                    </button>
                    <p className="text-[9px] text-slate-600 text-center">Dashboard unlocks after verification</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Search by name, sector, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-3 pl-10 pr-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: "all", label: "All Startups" },
              { id: "approved", label: "Verified" },
              { id: "pending", label: "Pending" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  filter === f.id
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Registered", value: startups.length, icon: Shield },
            { label: "Verified", value: startups.filter(s => s.status === "approved").length, icon: CheckCircle },
            { label: "Total Funding Sought", value: `$${(startups.reduce((a, s) => a + (s.funding_goal || 0), 0)).toLocaleString()}`, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
              <Icon size={18} className="text-slate-600 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</p>
                <p className="text-xl font-black italic">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Startup Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <Shield size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No startups match your search</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filtered.map((startup, i) => {
              const score = getTrustScore(startup);
              const colors = getTrustColor(score);
              const isApprovedStartup = startup.status === "approved";
              const isMine = myStartup?.id === startup.id;

              return (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative group p-6 rounded-2xl border transition-all ${
                    isMine
                      ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                      : "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/5"
                  }`}
                >
                  {/* Mine badge */}
                  {isMine && (
                    <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-lg">
                      You
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 p-[1px]">
                      <div className="w-full h-full rounded-xl bg-[#020617] flex items-center justify-center font-black italic text-xs text-white">
                        {startup.name?.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isApprovedStartup ? (
                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={9} /> Verified
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                          <Clock size={9} /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-black italic tracking-tight text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {startup.name}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{startup.sector}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
                      <Globe size={9} className="text-emerald-400" />{startup.country}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                    {startup.mission || startup.description}
                  </p>

                  {/* Metrics */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    {/* Trust Score Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Trust Score</span>
                        <span className={`text-xs font-black ${colors.text}`}>
                          {score}/100 · {getTrustLabel(score)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ delay: i * 0.04 + 0.3, duration: 0.6 }}
                          className={`h-full rounded-full ${
                            score >= 75 ? 'bg-emerald-400' :
                            score >= 50 ? 'bg-blue-400' :
                            score >= 30 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Goal</p>
                        <p className="text-sm font-black text-white">${(startup.funding_goal || 0).toLocaleString()}</p>
                      </div>
                      {startup.total_investments > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Raised</p>
                          <p className="text-sm font-black text-emerald-400">${(startup.total_investments || 0).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom CTA for pending founders */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center"
          >
            <Lock size={32} className="text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-black italic text-white mb-2">Dashboard Unlocks After Verification</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Once our admin team approves <strong className="text-white">{myStartup?.name}</strong>, you'll gain full access to set milestones, manage funding goals, and receive investments through the escrow protocol.
            </p>
            <button
              onClick={() => router.push("/startup-onboarding")}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors mx-auto"
            >
              <Edit size={14} /> Update Your Profile While You Wait
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
