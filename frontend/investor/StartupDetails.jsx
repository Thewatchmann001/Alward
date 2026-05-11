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
  Info
} from "lucide-react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Chat from "../components/Chat";
import TrustIntelligenceDashboard from "./TrustIntelligenceDashboard";
import AttestationStatus from "../components/attestation/AttestationStatus";

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

  if (loading) return <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div></div>;
  if (!startup) return <div className="py-20 text-center text-slate-500">Startup not found</div>;

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Shield className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-white">{startup.name}</h1>
            <div className="flex items-center gap-2 text-indigo-100 text-sm">
              <Building2 className="w-4 h-4" />
              <span>{startup.sector}</span>
              <span>•</span>
              <span>{startup.country || "Sierra Leone"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg border border-white/30">
            <ShieldCheck className="w-5 h-5 text-white" />
            <span className="font-semibold text-white">Verified</span>
          </div>
        </div>
      </div>

      {/* Verification Badges Area */}
      {founderId && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Shield className="w-5 h-5 text-indigo-600" />
               Verification Badges
             </h2>
             <button className="text-slate-400 hover:text-slate-600"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <AttestationStatus userId={founderId} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <TrendingUp className="w-5 h-5 text-indigo-600 mb-3" />
          <p className="text-[12px] text-slate-500 font-semibold mb-1">Credibility Score</p>
          <p className="text-2xl font-black text-indigo-700">
            {(startup.credibility_score || 0).toFixed(1)}%
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
          <Users className="w-5 h-5 text-emerald-600 mb-3" />
          <p className="text-[12px] text-slate-500 font-semibold mb-1">Verified Employees</p>
          <p className="text-2xl font-black text-emerald-700">
            {startup.employees_verified || 0}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
          <DollarSign className="w-5 h-5 text-purple-600 mb-3" />
          <p className="text-[12px] text-slate-500 font-semibold mb-1">Funding Goal</p>
          <p className="text-2xl font-black text-purple-700">
            ${(startup.funding_goal || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
          <Target className="w-5 h-5 text-orange-600 mb-3" />
          <p className="text-[12px] text-slate-500 font-semibold mb-1">Total Raised</p>
          <p className="text-2xl font-black text-orange-700">
            ${(startup.total_investments || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Risk Analysis Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
         <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Investment Risk Analysis
         </h2>
         <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
               <div className="w-3 h-3 mt-1 rounded-full bg-rose-500 flex-shrink-0"></div>
               <div>
                  <h4 className="text-rose-800 font-semibold text-sm">Investment Risk: HIGH</h4>
                  <p className="text-rose-700 text-sm mt-1">Early stage startup with some verification, higher investment risk.</p>
                  <p className="text-rose-600 text-xs mt-2 font-medium">Early stage, requires investor due diligence</p>
               </div>
            </div>
         </div>
         {/* Accordion mockup for Trust Intel */}
         <div className="space-y-3">
            {['Team Verification', 'Business Legitimacy', 'Product Traction', 'Blockchain Verification'].map((title, i) => (
               <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                     <Info className="w-4 h-4 text-slate-400" />
                     {title}
                  </span>
                  <span className="text-slate-400">▼</span>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center">
         <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Startup ID</p>
         <p className="font-mono font-bold text-slate-800">{startup.startup_id}</p>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          About the Startup
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {startup.description || "No description available."}
            </p>
          </div>

          {startup.mission && (
            <div className="bg-indigo-50/50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
              <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Mission
              </h3>
              <p className="text-indigo-800/80 text-sm">{startup.mission}</p>
            </div>
          )}

          {startup.vision && (
            <div className="bg-purple-50/50 border-l-4 border-purple-500 p-4 rounded-r-xl">
              <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                Vision
              </h3>
              <p className="text-purple-800/80 text-sm">{startup.vision}</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 py-3 border-t border-slate-100">
             <Users className="w-5 h-5 text-slate-400" />
             <div>
               <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Team Size</p>
               <p className="text-sm font-bold text-slate-800">{startup.team_size || 0} members</p>
             </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {startup.contact_email && (
            <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500">Email</span>
              </div>
              <a href={`mailto:${startup.contact_email}`} className="text-indigo-600 font-medium text-sm hover:underline">
                {startup.contact_email}
              </a>
            </div>
          )}
          {startup.phone && (
            <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500">Phone</span>
              </div>
              <a href={`tel:${startup.phone}`} className="text-indigo-600 font-medium text-sm hover:underline">
                {startup.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Verification */}
      {startup.transaction_signature && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 relative overflow-hidden">
          <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-100 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-900">Blockchain Verified</h3>
            </div>
            <p className="text-sm text-emerald-800 mb-4">This startup has been verified on the Solana blockchain.</p>
            <a
              href={`https://explorer.solana.com/tx/${startup.transaction_signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
            >
              View Transaction on Solana Explorer
            </a>
            <p className="text-[11px] text-emerald-700/60 mt-4 font-mono break-all bg-emerald-100/50 p-2 rounded">
              {startup.transaction_signature}
            </p>
          </div>
        </div>
      )}

      {/* Funding Wallet */}
      {startup.founder && startup.founder.wallet_address && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 relative overflow-hidden">
          <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-100 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Funding Wallet Address</h3>
            </div>
            <p className="text-sm text-indigo-800 mb-4">USDC investments are sent to this address (Devnet - test tokens only):</p>
            <div className="flex gap-2">
               <input 
                  type="text" 
                  readOnly 
                  value={startup.founder.wallet_address} 
                  className="flex-1 bg-white border border-indigo-200 text-indigo-900 font-mono text-sm px-4 py-2 rounded-lg"
               />
               <button
                  onClick={() => {
                  navigator.clipboard.writeText(startup.founder.wallet_address);
                  toast.success("Copied!");
                  }}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
               >
                  Copy Address
               </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code */}
      {user && user.role === "investor" && qrCode && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
           <p className="text-sm text-slate-500 font-medium">Share this startup's verification QR code</p>
           <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = qrCode;
              link.download = `startup-${startupId}-qr.png`;
              link.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            <QrCode className="w-4 h-4" />
            Download QR Code
          </button>
        </div>
      )}

      {/* Chat Action */}
      {user && user.role === "investor" && (
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md font-semibold"
        >
          <MessageSquare className="w-5 h-5" />
          {showChat ? "Hide Chat" : "Chat with Startup"}
        </button>
      )}

      {/* Chat Section */}
      {showChat && user && user.role === "investor" && startup.id && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-lg h-[500px] bg-white">
          <Chat
            investorId={user.id}
            startupId={startup.id}
            currentUserId={user.id}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}

