import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { Shield, TrendingUp, CheckCircle, ExternalLink, Activity, DollarSign, Clock, ArrowRight, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useEscrow } from "../lib/useEscrow";
import Logo from "../components/Logo";

export default function InvestorDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { investorApproveMilestone, loading: escrowLoading } = useEscrow();

  const [portfolio, setPortfolio] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    setLoading(true);
    if (user?.id) {
      await Promise.all([fetchPortfolio(), fetchMilestones()]);
    }
    setLoading(false);
  };

  const fetchPortfolio = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/investments/portfolio/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setPortfolio(await res.json());
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/investor/milestones/pending`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        setMilestones(await res.json());
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  const handleApproveMilestone = async (m) => {
    try {
      if (!m.investment_id_onchain) {
        toast.error("Could not find on-chain investment ID for this startup.");
        return;
      }
      
      toast("Please sign the transaction to approve this milestone.", { icon: "✍️" });
      const { signature } = await investorApproveMilestone({
        startupId: m.startup_id,
        investmentId: m.investment_id_onchain,
        milestoneIndex: m.milestone_index,
      });
      
      // We can create an endpoint to mark it as investor_approved, but on-chain is the source of truth
      toast.success(`Milestone Approved! TX: ${signature.slice(0, 10)}...`);
      fetchMilestones();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to approve milestone on-chain");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/investor-platform")}
              className="text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-widest"
            >
              Back to Marketplace
            </button>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Investor
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white">
                  {user?.full_name || user?.email}
                </p>
                <div className="h-3 w-[1px] bg-white/10 mx-1"></div>
                <span className="text-[10px] font-mono text-slate-500">
                  {user?.wallet_address ? `${user.wallet_address.substring(0, 4)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : "No Wallet"}
                </span>
                {user?.wallet_address && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.wallet_address);
                      toast.success("Address copied!");
                    }}
                    className="text-slate-600 hover:text-white transition-colors"
                  >
                    <Copy size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2">My Portfolio</h1>
            <p className="text-slate-400 font-medium">Track your on-chain investments and approve milestones.</p>
          </div>
        </div>

        {/* Action Required: Milestones */}
        {milestones.length > 0 && (
          <section className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/30">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400 mb-6 flex items-center gap-2">
              <Activity size={16} /> Action Required: Approve Milestones
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-3xl">
              These milestones have been physically validated by Ground Agents AND approved by the ALWARD System Admin. You are the final gate. Approve them to release funds to the founders.
            </p>
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="bg-white/5 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
                  <div>
                    <h3 className="text-xl font-bold uppercase italic text-white">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Startup: {m.startup_name}</p>
                    <p className="text-sm text-slate-300 mt-3 max-w-2xl">{m.description}</p>
                  </div>
                  <button 
                    onClick={() => handleApproveMilestone(m)}
                    disabled={escrowLoading}
                    className="px-8 py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    {escrowLoading ? "Signing..." : <><CheckCircle size={16} /> Approve & Release</>}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio Stats */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <DollarSign size={16} className="text-slate-500 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Invested (USDC)</p>
              <p className="text-3xl font-black italic">${(portfolio.total_invested_usdc || 0).toLocaleString()}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <TrendingUp size={16} className="text-slate-500 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Investments</p>
              <p className="text-3xl font-black italic">{portfolio.total_investments}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <Shield size={16} className="text-slate-500 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Startups Backed</p>
              <p className="text-3xl font-black italic">{portfolio.startup_count}</p>
            </div>
          </div>
        )}

        {/* Investment History */}
        <section className="glass-card-premium p-8 rounded-[2rem] border border-white/5">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-blue-400 mb-8 flex items-center gap-2">
            <Clock size={16} /> Investment History
          </h2>
          
          {!portfolio || portfolio.all_investments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>You haven't made any investments yet.</p>
              <button 
                onClick={() => router.push("/investor-platform")}
                className="mt-6 px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 font-bold uppercase tracking-widest text-xs hover:bg-blue-500/20 transition"
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Startup</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (USDC)</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.all_investments.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4">
                        <span className="font-bold text-white">{inv.startup_name}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-emerald-400">${inv.amount.toLocaleString()}</span>
                      </td>
                      <td className="py-4 text-sm text-slate-400">
                        {new Date(inv.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        {inv.explorer_url ? (
                          <a 
                            href={inv.explorer_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition"
                          >
                            View Tx <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[10px] uppercase tracking-widest">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
