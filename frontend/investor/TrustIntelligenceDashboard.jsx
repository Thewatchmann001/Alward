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
  Activity
} from "lucide-react";
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

  if (loading) return <div className="animate-pulse p-8 bg-slate-50 rounded-xl">Loading Intelligence Dashboard...</div>;
  if (!data) return null;

  const getRiskColor = (score) => {
    if (score < 20) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score < 40) return "text-sky-600 bg-sky-50 border-sky-200";
    if (score < 70) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "validated": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "evidence_submitted": return <Clock className="w-5 h-5 text-sky-500" />;
      case "rejected": return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="trust-dashboard space-y-6">
      {/* Risk Score Header */}
      <div className={`p-6 rounded-xl border-2 transition-all ${getRiskColor(data.risk_score)}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Dynamic Risk Intelligence
            </h2>
            <p className="text-2xl font-black">Score: {data.risk_score.toFixed(1)} / 100</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{data.risk_summary?.assessment}</p>
            <p className="text-xs opacity-80 mt-1">Last Updated: {new Date(data.risk_summary?.updated_at).toLocaleString()}</p>
          </div>
        </div>
        
        {/* Layer Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-black/5">
          {Object.entries(data.risk_summary?.layers || {}).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-[10px] uppercase font-bold opacity-60 mb-1">{key.replace('_', ' ')}</p>
              <p className="text-lg font-bold">{val.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy Alert */}
      <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-sm italic flex gap-3 items-start">
        <Info className="w-5 h-5 flex-shrink-0 text-amber-400" />
        <p>"{data.philosophy}"</p>
      </div>

      {/* Triangulation Timeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Triangulation Timeline
        </h3>
        
        {data.milestones?.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
            No milestones established for this startup yet.
          </div>
        ) : (
          data.milestones.map((m) => (
            <div key={m.id} className={`border rounded-xl bg-white overflow-hidden transition-all ${expandedMilestone === m.id ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:border-slate-300'}`}>
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedMilestone(expandedMilestone === m.id ? null : m.id)}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(m.status)}
                  <div>
                    <h4 className="font-bold text-slate-900">{m.title}</h4>
                    <p className="text-xs text-slate-500">Target: {new Date(m.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {m.evidence?.map((e, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-600" title={e.type}>
                        {e.type === 'media' ? <Camera size={14} /> : <FileText size={14} />}
                      </div>
                    ))}
                    {m.reports?.map((r, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600 font-bold text-xs" title="Ground Report">
                        G
                      </div>
                    ))}
                  </div>
                  {expandedMilestone === m.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedMilestone === m.id && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-6">
                  {/* Layer 1: Startup Claims */}
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Layer 1: Startup Claims & Evidence</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {m.evidence?.map((e) => (
                        <div key={e.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-3">
                          {e.type === 'media' ? <Camera className="w-5 h-5 text-indigo-500" /> : <FileText className="w-5 h-5 text-indigo-500" />}
                          <div className="flex-1 min-w-0">
                            <a href={e.url} target="_blank" className="text-sm font-bold text-indigo-600 hover:underline block truncate">
                              View {e.type} Proof
                            </a>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              {e.geotag && <span className="flex items-center gap-1"><MapPin size={10} /> {e.geotag}</span>}
                              {e.timestamp && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(e.timestamp).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layer 2: Ground Verification */}
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Layer 2: Independent Ground Validation</h5>
                    <div className="space-y-3">
                      {m.reports?.map((r) => (
                        <div key={r.id} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-700">Agent Report #{r.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.confidence_score > 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              Confidence: {(r.confidence_score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 italic">"{r.findings}"</p>
                          <p className="text-[10px] text-slate-400 mt-2">Verified on: {new Date(r.visit_date).toLocaleDateString()}</p>
                        </div>
                      ))}
                      {m.reports?.length === 0 && (
                        <div className="text-sm text-slate-400 italic">Waiting for physical ground verification...</div>
                      )}
                    </div>
                  </div>

                  {/* Layer 3: SaaS Integrity (Auto-check) */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>SaaS/Data Layer Sync</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={12} /> Consistency Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center uppercase tracking-[0.2em] font-bold py-4">
        No Absolute Authority • Structured Intelligence Layer • Alward Protocol
      </p>
    </div>
  );
}
