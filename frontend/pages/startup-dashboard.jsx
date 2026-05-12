import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import Chat from "../components/Chat";
import CredibilityImprovement from "../investor/CredibilityImprovement";
import AttestationStatus from "../components/attestation/AttestationStatus";
import VerificationFlow from "../components/attestation/VerificationFlow";
import ProposalManager from "../components/startup/ProposalManager";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  MessageSquare,
  ArrowLeft,
  Target,
  ExternalLink,
  Zap,
  Globe,
  ArrowRight,
  Database,
  Lock,
  Copy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Logo from "../components/Logo";

export default function StartupDashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const solanaAddress = user?.wallet_address || null;
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fundingProgress, setFundingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.id) {
      fetchStartupData();
    }
  }, [isAuthenticated, user?.id]);

  const fetchStartupData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/startups/by-founder/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStartup(data);
        if (data.funding_goal && data.total_investments) {
          const progress = (data.total_investments / data.funding_goal) * 100;
          setFundingProgress(Math.min(100, progress));
        }
        // If still pending, send to marketplace — dashboard is post-verification only
        if (data.status === 'pending') {
          toast("Your startup is pending admin approval. Visit the marketplace while you wait.", { icon: '⏳' });
          router.push('/startup-marketplace');
          return;
        }
      } else if (response.status === 404) {
        router.push("/startup-onboarding");
      }
    } catch (error) {
      toast.error("Protocol Sync Failed.");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setConversationsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/conversations/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      }
    } catch (error) {
      console.error("Chat sync failed:", error);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "messages" && user?.id) {
      fetchConversations();
    }
  }, [activeTab, user?.id]);

  if (!mounted || loading || !startup) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-alward-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-alward-blue/30">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-alward-blue/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-alward-emerald/5 blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="medium" />
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/startup-onboarding")}
              className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Edit size={14} /> Update Node
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-alward-blue to-alward-emerald p-[1px]">
              <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center font-black italic text-xs uppercase">
                {startup.name.substring(0, 2)}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Node Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-alward-blue mb-2">Primary Truth Node</h2>
            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">{startup.name}</h1>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Globe size={14} className="text-alward-emerald" /> {startup.country}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{startup.sector}</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
            <div className={`glass-card-premium px-8 py-4 rounded-2xl border-l-4 ${startup.status === 'pending' ? 'border-yellow-500' : startup.status === 'rejected' ? 'border-red-500' : 'border-alward-emerald'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Status</span>
              <span className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                {startup.status === 'pending' ? (
                  <><Clock size={14} className="text-yellow-500" /> Pending Admin Approval</>
                ) : startup.status === 'rejected' ? (
                  <><Clock size={14} className="text-red-500" /> Rejected</>
                ) : (
                  <><CheckCircle size={14} className="text-alward-emerald" /> Synchronized</>
                )}
              </span>
            </div>
            <div className="glass-card-premium px-8 py-4 rounded-2xl border-l-4 border-alward-blue flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Public Address</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {user?.wallet_address ? `${user.wallet_address.substring(0, 4)}...${user.wallet_address.substring(user.wallet_address.length - 4)}` : "None"}
                </span>
                {user?.wallet_address && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.wallet_address);
                      toast.success("Address copied!");
                    }}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="glass-card-premium px-8 py-4 rounded-2xl border-l-4 border-alward-blue">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Risk Score</span>
              <span className="text-sm font-black text-white uppercase tracking-widest">{startup.credibility_score?.toFixed(1) || "A+"}</span>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-12 no-scrollbar pb-2">
          {[
            { id: "overview", icon: TrendingUp, label: "Overview" },
            { id: "improve", icon: Target, label: "Credibility" },
            { id: "verification", icon: Shield, label: "Verifiers" },
            { id: "milestones", icon: Database, label: "Truth Ledger" },
            { id: "messages", icon: MessageSquare, label: "Neural Link" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-widest border ${
                activeTab === tab.id
                  ? "bg-alward-blue border-alward-blue text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Funding Module */}
                  <div className="glass-card-premium p-10 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-alward-blue">Funding Deployment</h3>
                      <DollarSign className="text-slate-700" />
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black italic tracking-tighter">${(startup.total_investments || 0).toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Raised</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Goal: ${(startup.funding_goal || 0).toLocaleString()}</span>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fundingProgress}%` }}
                          className="h-full bg-gradient-to-r from-alward-blue to-alward-emerald rounded-full"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-alward-emerald">{fundingProgress.toFixed(1)}% Deployed</span>
                        <span className="text-slate-500">{startup.investor_count || 0} Backers</span>
                      </div>
                    </div>
                  </div>

                  {/* Node Identity */}
                  <div className="glass-card-premium p-10 rounded-[2.5rem] space-y-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">About Truth Node</h3>
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-alward-blue block mb-2">Mission Directive</span>
                        <p className="text-slate-300 leading-relaxed font-medium">{startup.mission || startup.description}</p>
                      </div>
                      {startup.vision && (
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-alward-emerald block mb-2">Future Projection</span>
                          <p className="text-slate-300 leading-relaxed font-medium">{startup.vision}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Performance Metrics */}
                  <div className="glass-card-premium p-10 rounded-[2.5rem] space-y-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Live Metrics</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Network Size</span>
                        <span className="text-lg font-black italic">{startup.team_size || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verification Level</span>
                        <span className="text-lg font-black italic text-alward-blue">Tier 1</span>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Link */}
                  {startup.transaction_signature && (
                    <div className="glass-card-premium p-10 rounded-[2.5rem] border-t-2 border-alward-blue bg-alward-blue/5">
                      <Lock className="text-alward-blue mb-4" size={24} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-2">Immutable Hash</h3>
                      <p className="text-[10px] font-mono text-slate-500 break-all mb-6">{startup.transaction_signature}</p>
                      <a
                        href={`https://explorer.solana.com/tx/${startup.transaction_signature}?cluster=devnet`}
                        target="_blank"
                        className="btn-alward-primary w-full py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={14} /> Explorer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "improve" && <CredibilityImprovement startup={startup} onUpdate={fetchStartupData} />}
            {activeTab === "verification" && (
              <div className="space-y-12">
                <AttestationStatus userId={user.id} walletAddress={solanaAddress} onUpdate={fetchStartupData} />
                <VerificationFlow user={user} onComplete={fetchStartupData} />
              </div>
            )}
            {activeTab === "milestones" && <ProposalManager startupId={startup.id} />}
            {activeTab === "messages" && (
              <div className="glass-card-premium rounded-[3rem] overflow-hidden flex flex-col h-[700px]">
                {selectedConversation ? (
                  <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedConversation(null)} className="text-slate-500 hover:text-white"><ArrowLeft /></button>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">
                          {selectedConversation.investor_name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <Chat investorId={selectedConversation.investor_id} startupId={selectedConversation.startup_id} currentUserId={user?.id} onClose={() => setSelectedConversation(null)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full">
                    <div className="w-full md:w-1/3 border-r border-white/5 overflow-y-auto">
                      <div className="p-8 border-b border-white/5"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Links</h3></div>
                      {conversationsLoading ? <div className="p-8 text-center animate-pulse text-slate-500">Syncing...</div> : conversations.length === 0 ? <div className="p-8 text-center text-slate-500">No active links</div> : (
                        <div className="divide-y divide-white/5">
                          {conversations.map(c => (
                            <button key={c.id} onClick={() => setSelectedConversation(c)} className="w-full p-8 text-left hover:bg-white/[0.02] transition-colors group">
                              <div className="font-black uppercase italic text-sm mb-1 group-hover:text-alward-blue transition-colors">{c.investor_name}</div>
                              <div className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{c.last_message_preview}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex flex-1 items-center justify-center text-slate-700 bg-white/[0.01]">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Select Node for Secure Communication</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

