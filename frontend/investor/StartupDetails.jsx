import { useState, useEffect } from "react";
import {
  Shield,
  TrendingUp,
  Users,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  QrCode,
  FileText,
  DollarSign,
  Briefcase,
  Target,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Info,
  ExternalLink,
  MapPin,
  Building2,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Chat from "../components/Chat";
import TrustIntelligenceDashboard from "./TrustIntelligenceDashboard";
import AttestationStatus from "../components/attestation/AttestationStatus";
import { motion } from "framer-motion";

export default function StartupDetails({ startupId }) {
  const router = useRouter();
  const { user } = useAuth();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [founderId, setFounderId] = useState(null);

  useEffect(() => {
    if (startupId) {
      fetchStartupDetails();
    }
  }, [startupId]);

  useEffect(() => {
    if (startupId && startup && user?.role === "investor") {
      fetchQRCode();
    }
  }, [startupId, startup, user]);

  const fetchStartupDetails = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/startups/${startupId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch startup");
      }

      const data = await response.json();
      setStartup(data);
      if (data.founder?.id) setFounderId(data.founder.id);
      else if (data.founder_id) setFounderId(data.founder_id);
    } catch (error) {
      toast.error("Failed to fetch startup details");
      setStartup(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/startups/${startupId}/qr`);
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr_code);
      }
    } catch (error) {}
  };

  if (loading) return (
    <div className="py-20 text-center">
      <RefreshCw className="animate-spin w-10 h-10 text-alward-blue mx-auto mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Decrypting Truth Layers...</p>
    </div>
  );
  
  if (!startup) return (
    <div className="py-20 text-center">
      <Info size={48} className="text-slate-700 mx-auto mb-4 opacity-20" />
      <p className="text-slate-500 font-bold">Startup record not found in protocol.</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group rounded-[2.5rem] p-10 text-white overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' }}
      >
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
           <Shield className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <button 
              onClick={() => router.back()}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3 bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Protocol Node</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-4 text-white leading-none">
                {startup.name}
              </h1>
              <div className="flex items-center gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-alward-blue" />
                  <span className="text-xs font-bold uppercase tracking-widest">{startup.sector}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">{startup.country || "Sierra Leone"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Credibility Score</p>
                <p className="text-3xl font-black italic text-alward-blue">{(startup.credibility_score || 0).toFixed(1)}%</p>
              </div>
              <div className="w-[1px] h-12 bg-white/10"></div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Funding Sought</p>
                <p className="text-3xl font-black italic text-white">${(startup.funding_goal || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Intelligence & Trust */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Trust Intelligence Dashboard Component */}
          <section className="glass-card-premium rounded-[2rem] p-8 border border-white/5 bg-white/[0.02]">
            <TrustIntelligenceDashboard startupId={startup.id} />
          </section>

          {/* About Section */}
          <section className="glass-card-premium rounded-[2rem] p-10 border border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-alward-blue" />
              Executive Summary
            </h2>
            
            <div className="space-y-8">
              <div>
                <p className="text-lg text-slate-300 leading-relaxed font-medium">
                  {startup.description || "No project description provided."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {startup.mission && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-alward-blue mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Mission
                    </h3>
                    <p className="text-sm text-slate-400 italic leading-relaxed">"{startup.mission}"</p>
                  </div>
                )}
                {startup.vision && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Vision
                    </h3>
                    <p className="text-sm text-slate-400 italic leading-relaxed">"{startup.vision}"</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-8 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                   <Users className="w-5 h-5 text-slate-600" />
                   <div>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol Sync</p>
                     <p className="text-sm font-bold text-white">{startup.team_size || 0} Members On-Chain</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <Clock className="w-5 h-5 text-slate-600" />
                   <div>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Genesis</p>
                     <p className="text-sm font-bold text-white">Est. {startup.year_founded || "2024"}</p>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Interaction & Proof */}
        <div className="space-y-8">
          
          {/* Action Card: Chat */}
          {user && user.role === "investor" && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-alward-blue text-[#020617] hover:bg-blue-400 transition-all shadow-[0_0_50px_rgba(37,99,235,0.2)] group"
            >
              <div className="w-14 h-14 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Direct Communication</p>
                <p className="text-xl font-black italic tracking-tighter">{showChat ? "Secure Node Active" : "Initiate Secure Channel"}</p>
              </div>
            </button>
          )}

          {/* Verification Status */}
          {founderId && (
            <div className="glass-card-premium rounded-[2rem] p-8 border border-white/5 bg-white/[0.02]">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verification Badges
              </h2>
              <AttestationStatus userId={founderId} />
            </div>
          )}

          {/* Blockchain Proof */}
          {startup.transaction_signature && (
            <div className="glass-card-premium rounded-[2rem] p-8 border border-emerald-500/20 bg-emerald-500/[0.03]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="text-emerald-400" size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">On-Chain Registry</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">This startup has established a permanent anchor on the Solana blockchain for transparent verification.</p>
              <a
                href={`https://explorer.solana.com/tx/${startup.transaction_signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-emerald-500 text-[#020617] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"
              >
                View Explorer <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Contact Details */}
          <div className="glass-card-premium rounded-[2rem] p-8 border border-white/5 bg-white/[0.02] space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
              <Mail className="w-4 h-4 text-alward-blue" /> Official Channels
            </h2>
            <div className="space-y-4">
              {startup.contact_email && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Email Protocol</p>
                  <a href={`mailto:${startup.contact_email}`} className="text-sm font-bold text-white hover:text-alward-blue transition-colors break-all">
                    {startup.contact_email}
                  </a>
                </div>
              )}
              {startup.phone && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Direct Line</p>
                  <a href={`tel:${startup.phone}`} className="text-sm font-bold text-white hover:text-alward-blue transition-colors">
                    {startup.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay/Section */}
      {showChat && user && user.role === "investor" && startup.id && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-premium rounded-[2rem] overflow-hidden shadow-2xl border border-alward-blue/20 h-[600px] bg-[#020617]"
        >
          <Chat
            investorId={user.id}
            startupId={startup.id}
            currentUserId={user.id}
            onClose={() => setShowChat(false)}
          />
        </motion.div>
      )}
    </div>
  );
}

