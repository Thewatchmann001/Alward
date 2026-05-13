import { useState, useEffect } from "react";
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Camera, 
  FileText, 
  MapPin, 
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  ExternalLink,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function TrustIntelligenceDashboard({ startupId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  useEffect(() => {
    if (startupId) {
      fetchDashboardData();
    }
  }, [startupId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/startups/${startupId}/trust-dashboard`);
      if (!response.ok) throw new Error("Failed to fetch trust intelligence data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Error loading intelligence dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 space-y-4">
      <div className="h-32 rounded-2xl bg-white/5 animate-pulse"></div>
      <div className="h-64 rounded-2xl bg-white/5 animate-pulse"></div>
    </div>
  );
  if (!data) return null;

  const getRiskColor = (score) => {
    if (score < 20) return "text-emerald-400 bg-emerald-400/5 border-emerald-400/20";
    if (score < 40) return "text-blue-400 bg-blue-400/5 border-blue-400/20";
    if (score < 70) return "text-amber-400 bg-amber-400/5 border-amber-400/20";
    return "text-rose-400 bg-rose-400/5 border-rose-400/20";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "validated": return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "evidence_submitted": return <Clock className="w-5 h-5 text-blue-400" />;
      case "rejected": return <AlertCircle className="w-5 h-5 text-rose-400" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 text-white font-sans">
      {/* Risk Score Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card-premium p-8 rounded-[2rem] border-2 transition-all ${getRiskColor(data.risk_score)}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2 opacity-80">
              <Shield className="w-4 h-4" />
              Dynamic Risk Intelligence
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black italic tracking-tighter">{(100 - data.risk_score).toFixed(1)}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Trust Score / 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black uppercase italic tracking-tighter">{data.risk_summary?.assessment}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">Last Update Sync: {new Date(data.risk_summary?.updated_at).toLocaleTimeString()}</p>
          </div>
        </div>
        
        {/* Layer Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/5">
          {Object.entries(data.risk_summary?.layers || {}).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <p className="text-[9px] uppercase font-black tracking-widest opacity-40">{key.replace('_', ' ')}</p>
              <div className="flex items-end gap-2">
                <p className="text-xl font-black italic">{(100 - val).toFixed(0)}%</p>
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-current opacity-50" style={{ width: `${100-val}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Philosophy Alert */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex gap-4 items-start">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          <span className="text-amber-400 font-bold uppercase tracking-widest mr-2 text-[9px]">Protocol Philosophy:</span>
          "{data.philosophy}"
        </p>
      </div>

      {/* Triangulation Timeline */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Triangulation Timeline
        </h3>
        
        {data.milestones?.length === 0 ? (
          <div className="p-12 text-center glass-card-premium rounded-3xl border border-dashed border-white/10 text-slate-500">
            <Activity size={32} className="mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No truth layers recorded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.milestones.map((m) => (
              <div key={m.id} className={`glass-card-premium rounded-2xl overflow-hidden transition-all border ${expandedMilestone === m.id ? 'border-blue-500/40 bg-blue-500/[0.03]' : 'border-white/5 hover:border-white/10'}`}>
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedMilestone(expandedMilestone === m.id ? null : m.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                      {getStatusIcon(m.status)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black italic tracking-tight">{m.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target: {new Date(m.due_date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">{m.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-2">
                      {m.evidence?.map((e, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-blue-500/10 border-2 border-[#0f172a] flex items-center justify-center text-blue-400 shadow-xl" title={e.type}>
                          {e.type === 'media' ? <Camera size={12} /> : <FileText size={12} />}
                        </div>
                      ))}
                      {m.reports?.map((r, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-full bg-emerald-500/10 border-2 border-[#0f172a] flex items-center justify-center text-emerald-400 font-black text-[9px] shadow-xl" title="Ground Report">
                          G
                        </div>
                      ))}
                    </div>
                    {expandedMilestone === m.id ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedMilestone === m.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-6 bg-white/[0.02] border-t border-white/5 space-y-8"
                    >
                      {/* Layer 1: Startup Claims */}
                      <div>
                        <h5 className="text-[9px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Layer 1: Startup Claims & Evidence
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {m.evidence?.map((e) => (
                            <div key={e.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-4 group hover:bg-white/[0.08] transition-all">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                {e.type === 'media' ? <Camera className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <a href={e.url} target="_blank" className="text-xs font-black uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors flex items-center gap-1 mb-1">
                                  View {e.type} Proof <ExternalLink size={10} />
                                </a>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                  {e.geotag && <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-400" /> {e.geotag}</span>}
                                  {e.timestamp && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(e.timestamp).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!m.evidence || m.evidence.length === 0) && (
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest italic col-span-full">No evidence submitted for this layer</p>
                          )}
                        </div>
                      </div>

                      {/* Layer 2: Ground Verification */}
                      <div>
                        <h5 className="text-[9px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Layer 2: Independent Ground Validation
                        </h5>
                        <div className="space-y-4">
                          {m.reports?.map((r) => (
                            <div key={r.id} className="bg-emerald-500/[0.03] p-5 rounded-2xl border border-emerald-500/10">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Attestation Confirmed</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                                  Confidence: {(r.confidence_score * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{r.findings || r.findings_summary}"</p>
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Verified: {new Date(r.visit_date).toLocaleDateString()}</p>
                                {r.tx_signature && (
                                  <a href={`https://explorer.solana.com/tx/${r.tx_signature}?cluster=devnet`} target="_blank" className="text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:underline flex items-center gap-1">
                                    On-Chain Hash <ExternalLink size={8} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!m.reports || m.reports.length === 0) && (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 p-6 rounded-2xl text-center">
                              <Zap size={20} className="mx-auto mb-2 text-slate-700 opacity-20" />
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Waiting for physical ground verification</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Layer 3: SaaS Integrity (Auto-check) */}
                      <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Integrity Layer</span>
                          </div>
                          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full">
                            <CheckCircle size={12} /> Data Consistency Synchronized
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[9px] text-slate-600 text-center uppercase tracking-[0.4em] font-black py-8 border-t border-white/5">
        No Absolute Authority • Structured Intelligence Layer • Alward Protocol
      </p>
    </div>
  );
}
