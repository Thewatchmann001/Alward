import { useState, useEffect, useMemo } from "react";
import { Search, Filter, TrendingUp, Shield, ArrowUpDown, DollarSign, Calendar } from "lucide-react";
import StartupCard from "../components/StartupCard";
import toast from "react-hot-toast";

const INDUSTRIES = [
  { value: "all", label: "All Industries" },
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "Education", label: "Education" },
  { value: "Finance", label: "Finance" },
  { value: "Tourism", label: "Tourism" },
  { value: "Construction", label: "Construction" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "most_funded", label: "Most Funded" },
  { value: "highest_credibility", label: "Highest Credibility" },
];

export default function StartupListEnhanced({ onStartupSelect }) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [minCredibility, setMinCredibility] = useState(0);

  useEffect(() => {
    fetchStartups();
  }, [filterSector, minCredibility]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: "0",
        limit: "100",
        min_credibility: minCredibility.toString(),
      });
      if (filterSector !== "all") {
        params.append("sector", filterSector);
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/startups/list?${params}`);
      const data = await response.json();
      setStartups(data.startups || []);
    } catch (error) {
      toast.error("Failed to fetch startups");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedStartups = useMemo(() => {
    let filtered = startups.filter((startup) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        startup.name?.toLowerCase().includes(searchLower) ||
        startup.description?.toLowerCase().includes(searchLower) ||
        startup.sector?.toLowerCase().includes(searchLower);
      
      const matchesCredibility = (startup.credibility_score || 0) >= minCredibility;
      
      return matchesSearch && matchesCredibility;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "most_funded":
          return (b.total_investments || 0) - (a.total_investments || 0);
        case "highest_credibility":
          return (b.credibility_score || 0) - (a.credibility_score || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [startups, searchTerm, minCredibility, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-end gap-5">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Industry</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Min Credibility: {minCredibility}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minCredibility}
              onChange={(e) => setMinCredibility(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[12px] font-medium text-slate-500">
          <span>Showing {filteredAndSortedStartups.length} of {startups.length} startups</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredAndSortedStartups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStartups.map((startup) => (
            <div key={startup.id} onClick={() => onStartupSelect && onStartupSelect(startup)}>
              <StartupCard startup={startup} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium">No startups found matching criteria</p>
        </div>
      )}
    </div>
  );
}

