import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, CheckCircle, XCircle, Clock, Check,
  RefreshCw, Users, Zap, AlertTriangle, ExternalLink, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEscrow } from "../lib/useEscrow";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Logo from "../components/Logo";

// ── Approval status badge ────────────────────────────────────────────────────
function ApprovalBadge({ done, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
        done
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-white/5 border-white/10 text-slate-500"
      }`}
    >
      {done ? <Check size={10} /> : <Clock size={10} />}
      {label}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { connected } = useWallet();
  const {
    alwardApproveMilestone,
    investorApproveMilestone,
    loading: escrowLoading,
  } = useEscrow();

  const [startups, setStartups] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [agentApps, setAgentApps] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track per-milestone signing state: { [milestoneId]: 'idle'|'alward'|'investor'|'done'|'error' }
  const [signingState, setSigningState] = useState({});

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") {
      toast.error("Unauthorized access.");
      router.push("/");
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchStartups(), fetchMilestones(), fetchAgentApps()]);
    setLoading(false);
  };

  const fetchStartups = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/startups/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setStartups(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMilestones = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/milestones/pending`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setMilestones(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAgentApps = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/ground-agents/applications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) setAgentApps(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleApproveStartup = async (startupId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/startups/${startupId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) { toast.success("Startup approved!"); fetchStartups(); }
      else toast.error("Failed to approve startup");
    } catch { toast.error("Error approving startup"); }
  };

  const handleRejectStartup = async (startupId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/startups/${startupId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) { toast.success("Startup rejected!"); fetchStartups(); }
      else toast.error("Failed to reject startup");
    } catch { toast.error("Error rejecting startup"); }
  };

  const handleApproveAgent = async (appId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/ground-agents/applications/${appId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) { toast.success("Ground Agent approved!"); fetchAgentApps(); }
      else toast.error("Failed to approve agent");
    } catch { toast.error("Error approving agent"); }
  };

  const handleRejectAgent = async (appId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/ground-agents/applications/${appId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) { toast.success("Application rejected"); fetchAgentApps(); }
      else toast.error("Failed to reject application");
    } catch { toast.error("Error rejecting application"); }
  };

  /**
   * TRIPLE APPROVAL FLOW (Demo / Hackathon)
   * ────────────────────────────────────────
   * Milestone is already agent_approved (ground agent did step 1).
   * Admin wallet signs BOTH:
   *   Step 2 → alward_approve_milestone (platform approval)
   *   Step 3 → investor_approve_milestone (using investment_id from backend)
   *
   * This works in demo mode where admin wallet = investor wallet.
   * In production, step 3 would be triggered by the actual investor
   * via the investor dashboard.
   */
  const handleFullApproval = async (m) => {
    if (!connected) {
      toast.error("Connect your Solana wallet first.");
      return;
    }
    if (m.milestone_index === undefined || m.milestone_index < 0) {
      toast.error("Invalid milestone index.");
      return;
    }

    const mid = m.id;
    setSigningState((s) => ({ ...s, [mid]: "alward" }));

    // ── Step 2: ALWARD Platform Approval ──────────────────────────────────
    const t1 = toast.loading("Step 2/3 — Signing as ALWARD platform...");
    let alwardSig;
    try {
      const result = await alwardApproveMilestone({
        startupId: m.startup_id,
        milestoneIndex: m.milestone_index,
      });
      alwardSig = result.signature;
      toast.dismiss(t1);
      toast.success(`ALWARD approved! TX: ${alwardSig.slice(0, 8)}...`);

      // Sync to backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/admin/milestones/${mid}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).catch(() => {});
    } catch (err) {
      toast.dismiss(t1);
      toast.error(`ALWARD approval failed: ${err.message}`);
      setSigningState((s) => ({ ...s, [mid]: "error" }));
      return;
    }

    // ── Step 3: Investor Approval ─────────────────────────────────────────
    // Use investment_id_onchain if available (from backend). In demo mode
    // we fall back gracefully if the backend doesn't have it.
    setSigningState((s) => ({ ...s, [mid]: "investor" }));

    if (!m.investment_id_onchain) {
      toast(
        "Step 3 pending: Investor must approve in the Investor Dashboard.\n" +
        "In demo mode: ensure the investor wallet is connected there.",
        { icon: "ℹ️", duration: 8000 }
      );
      setSigningState((s) => ({ ...s, [mid]: "partial" }));
      fetchMilestones();
      return;
    }

    const t2 = toast.loading("Step 3/3 — Signing as Investor (demo mode)...");
    try {
      const result = await investorApproveMilestone({
        startupId: m.startup_id,
        investmentId: m.investment_id_onchain,
        milestoneIndex: m.milestone_index,
      });
      toast.dismiss(t2);
      toast.success(`✅ All 3 approvals done! Tranche unlocked. TX: ${result.signature.slice(0, 8)}...`, { duration: 6000 });
      setSigningState((s) => ({ ...s, [mid]: "done" }));
    } catch (err) {
      toast.dismiss(t2);
      toast(
        `ALWARD signed ✅ — Investor approval still needed.\n${err.message}`,
        { icon: "⚠️", duration: 8000 }
      );
      setSigningState((s) => ({ ...s, [mid]: "partial" }));
    }

    fetchMilestones();
  };

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-[#C9A04A]/20">
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-[#C9A04A]/10 !border !border-[#C9A04A]/30 !text-[#C9A04A] !font-black !text-[10px] !uppercase !tracking-widest !rounded-xl !py-2" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Shield size={16} style={{ color: '#C9A04A' }} />
              System Admin
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: '#C9A04A' }}>
              System Control
            </h2>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2">Admin Dashboard</h1>
            <p className="text-slate-400 font-medium">Approve Truth Nodes, manage agents, and sign on-chain milestone releases.</p>
          </div>
          <button onClick={fetchData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── Wallet connection warning ── */}
        {!connected && (
          <div className="flex items-start gap-4 p-6 rounded-2xl border" style={{ borderColor: '#C9A04A33', background: '#C9A04A08' }}>
            <AlertTriangle size={20} style={{ color: '#C9A04A' }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm" style={{ color: '#C9A04A' }}>Wallet not connected</p>
              <p className="text-slate-400 text-xs mt-1">
                You must connect your Solana wallet to sign on-chain milestone approvals.
                Use the button in the top-right to connect.
              </p>
            </div>
          </div>
        )}

        {/* ── Milestones — TRIPLE APPROVAL SECTION ── */}
        <section className="glass-card-premium p-8 rounded-[2rem] border-t-4" style={{ borderColor: '#C9A04A' }}>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2" style={{ color: '#C9A04A' }}>
            <Zap size={16} /> On-Chain Milestone Approvals ({milestones.length})
          </h2>
          <p className="text-slate-400 text-sm mb-3 max-w-3xl">
            Ground agents have physically verified these milestones (Step 1 ✅). 
            Click <strong className="text-white">"Sign Full Approval"</strong> to execute Steps 2 &amp; 3 
            on-chain — ALWARD platform approval followed by investor confirmation.
            Once all 3 are signed, anyone can trigger the USDC tranche release.
          </p>

          {/* Approval key */}
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Approval Flow:</span>
            <ApprovalBadge done label="1 — Ground Agent" />
            <span className="text-slate-700">→</span>
            <ApprovalBadge done={false} label="2 — ALWARD Admin" />
            <span className="text-slate-700">→</span>
            <ApprovalBadge done={false} label="3 — Investor" />
            <span className="text-slate-700">→</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tranche Releases</span>
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No milestones pending ALWARD approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((m) => {
                const state = signingState[m.id] || "idle";
                const isDone = state === "done";
                const isPartial = state === "partial";
                const isSigning = state === "alward" || state === "investor";
                const isError = state === "error";

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 border transition-all ${
                      isDone
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : isPartial
                        ? "bg-[#C9A04A]/5 border-[#C9A04A]/20"
                        : "bg-white/5 border-white/5"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <h3 className="text-xl font-bold uppercase italic text-white">{m.title}</h3>
                          {isDone && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                              ✅ All 3 Approved — Tranche Unlocked
                            </span>
                          )}
                          {isPartial && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border" style={{ background: '#C9A04A0D', borderColor: '#C9A04A33', color: '#C9A04A' }}>
                              ⚠️ ALWARD Signed — Investor Approval Pending
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                          Startup: {m.startup_name} &nbsp;•&nbsp; Milestone Index: {m.milestone_index}
                        </p>
                        <p className="text-sm text-slate-300 max-w-2xl mb-4">{m.description}</p>

                        {/* Approval status pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <ApprovalBadge done label="Agent Verified" />
                          <ApprovalBadge done={isDone || isPartial} label="ALWARD Signed" />
                          <ApprovalBadge done={isDone} label="Investor Signed" />
                          {m.validation_score && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              Agent Confidence: {m.validation_score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="flex-shrink-0">
                        {isDone ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle size={28} className="text-emerald-400" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Complete</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFullApproval(m)}
                            disabled={isSigning || escrowLoading || !connected}
                            className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: isSigning ? 'rgba(201,160,74,0.1)' : '#C9A04A',
                              color: isSigning ? '#C9A04A' : '#020617',
                              boxShadow: isSigning ? 'none' : '0 0 30px rgba(201,160,74,0.25)',
                            }}
                          >
                            {isSigning ? (
                              <>
                                <Loader size={14} className="animate-spin" />
                                {state === "alward" ? "Signing ALWARD..." : "Signing Investor..."}
                              </>
                            ) : isPartial ? (
                              <><Zap size={14} /> Retry Investor Approval</>
                            ) : (
                              <><Shield size={14} /> Sign Full Approval (2+3)</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Partial state instructions */}
                    <AnimatePresence>
                      {isPartial && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
                        >
                          <p className="text-xs text-slate-400 leading-relaxed">
                            <strong className="text-white">ALWARD approval is recorded on-chain ✅</strong>
                            <br />
                            The investor needs to complete Step 3 via their{" "}
                            <a href="/investor-dashboard" className="underline" style={{ color: '#C9A04A' }}>
                              Investor Dashboard
                            </a>
                            . In demo mode: if the admin wallet IS the investor wallet, click "Retry Investor Approval" above.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Pending Startups ── */}
        <section className="glass-card-premium p-8 rounded-[2rem] border-t-2 border-alward-blue">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-alward-blue mb-8 flex items-center gap-2">
            <Clock size={16} /> Pending Startups ({startups.length})
          </h2>
          {startups.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No startups pending approval.</p>
          ) : (
            <div className="space-y-4">
              {startups.map((startup) => (
                <div key={startup.id} className="bg-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5">
                  <div>
                    <h3 className="text-xl font-bold uppercase italic">{startup.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{startup.sector} • {startup.founder_email}</p>
                    <p className="text-sm text-slate-300 mt-3 max-w-2xl line-clamp-2">{startup.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRejectStartup(startup.id)} className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition flex items-center gap-2">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => handleApproveStartup(startup.id)} className="px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-widest text-xs hover:bg-emerald-500/20 transition flex items-center gap-2">
                      <CheckCircle size={16} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Ground Agent Applications ── */}
        <section className="glass-card-premium p-8 rounded-[2rem] border-t-2 border-emerald-500">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 mb-8 flex items-center gap-2">
            <Users size={16} /> Ground Agent Applications ({agentApps.length})
          </h2>
          {agentApps.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No applications pending.</p>
          ) : (
            <div className="space-y-4">
              {agentApps.map((app) => (
                <div key={app.id} className="bg-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 border border-white/5">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold uppercase italic">{app.full_name}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{app.email} • {app.location}</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Field Experience</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{app.experience}</p>
                      </div>
                      <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Motivation</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{app.motivation}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end md:self-start">
                    <button onClick={() => handleRejectAgent(app.id)} className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition">
                      Reject
                    </button>
                    <button onClick={() => handleApproveAgent(app.id)} className="px-8 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-widest text-xs hover:bg-emerald-500/20 transition flex items-center gap-2">
                      <Check size={14} /> Approve Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
