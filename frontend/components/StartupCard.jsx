import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, MapPin, Users, TrendingUp, ExternalLink, ShieldCheck } from "lucide-react";
import { startupAPI } from "../lib/api";
import toast from "react-hot-toast";

const StartupCard = ({ startup }) => {
  const [showEmployees, setShowEmployees] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const getRiskInfo = (score) => {
    // Treat as Confidence: 100 - Risk
    const confidence = score || 0;
    if (confidence >= 80) return { grade: "A", color: "text-slate-900" };
    if (confidence >= 60) return { grade: "B", color: "text-slate-900" };
    if (confidence >= 40) return { grade: "C", color: "text-slate-900" };
    return { grade: "D", color: "text-slate-900" };
  };

  const riskInfo = getRiskInfo(startup.credibility_score);

  const handleShowEmployees = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (showEmployees) {
      setShowEmployees(false);
      return;
    }
    try {
      setLoadingEmployees(true);
      const response = await startupAPI.getEmployees(startup.startup_id);
      setEmployees(response.data || []);
      setShowEmployees(true);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  return (
    <>
      <Link href={`/investor-platform?startupId=${startup.startup_id}`}>
        <div className="card-hover p-5 flex flex-col h-full bg-white relative">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-slate-900 flex flex-shrink-0 items-center justify-center text-white shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0 pr-12">
              <h3 className="text-[17px] font-bold text-slate-900 leading-tight mb-1 truncate">
                {startup.name}
              </h3>
              <p className="text-slate-500 text-[13px] font-medium">{startup.sector}</p>
              <p className="text-slate-400 text-[10px] font-mono mt-1 break-all tracking-wider uppercase">
                ID: {startup.startup_id || "N/A"}
              </p>
            </div>
            <div className="absolute top-5 right-5 text-right flex flex-col items-end">
              <span className={`text-2xl font-black leading-none ${riskInfo.color}`}>{riskInfo.grade}</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Credibility</span>
            </div>
          </div>

          <div className="space-y-3 mb-6 flex-1">
            {startup.country && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-medium">{startup.country}</span>
              </div>
            )}
            <button
              onClick={handleShowEmployees}
              className="flex items-center gap-2.5 text-slate-600 hover:text-indigo-600 transition-colors w-full text-left"
            >
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-medium">
                {startup.employees_verified || 0} Verified Employees (click to view)
              </span>
            </button>
            {startup.credibility_score !== undefined && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-medium">
                  Score: {startup.credibility_score?.toFixed(1)}/100
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            {/* Badges placeholder (for devnet tests) */}
            <div className="flex flex-col gap-2 mb-4">
              {startup.credibility_score > 50 && (
                 <>
                   <div className="bg-amber-100/50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-1 rounded-full flex w-fit items-center gap-1">
                      <span className="text-amber-500">✓</span> Test Verified Business (Devnet)
                   </div>
                   <div className="bg-amber-100/50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-1 rounded-full flex w-fit items-center gap-1">
                      <span className="text-amber-500">✓</span> Test Verified Identity (Devnet)
                   </div>
                 </>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[13px] font-bold text-emerald-700">
                  Blockchain Verified
                </span>
              </div>
              <span className="text-[12px] text-slate-900 font-semibold flex items-center gap-1 hover:text-indigo-600 transition-colors">
                View Details <span className="text-slate-400">→</span>
              </span>
            </div>

            {startup.transaction_signature && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-900/60 mb-0.5 uppercase tracking-wider">Transaction Hash:</p>
                <a
                  href={`https://explorer.solana.com/tx/${startup.transaction_signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-mono break-all flex items-center gap-1.5 hover:underline"
                >
                  <span className="truncate">{startup.transaction_signature.substring(0, 18)}...</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                </a>
              </div>
            )}
          </div>
        </div>
      </Link>
    </>
  );
};

export default StartupCard;

