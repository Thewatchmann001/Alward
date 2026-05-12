import { useState, useEffect } from "react";
import { 
  Plus, 
  Target, 
  Clock, 
  CheckCircle, 
  Send,
  AlertCircle,
  FileText,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProposalManager({ startupId }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Proposal Form
  const [fundingGoal, setFundingGoal] = useState("");
  const [milestones, setMilestones] = useState([{ title: "", amount: "", description: "" }]);

  useEffect(() => {
    if (startupId) fetchProposals();
  }, [startupId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/proposals/my-proposals`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProposals(data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: "", amount: "", description: "" }]);
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/proposals`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          startup_id: startupId,
          funding_goal: parseFloat(fundingGoal),
          milestones: milestones.map(m => ({
            ...m,
            amount: parseFloat(m.amount)
          }))
        })
      });
      if (response.ok) {
        toast.success("Draft Proposal created!");
        setShowAddModal(false);
        setFundingGoal("");
        setMilestones([{ title: "", amount: "", description: "" }]);
        fetchProposals();
      } else {
        toast.error("Failed to create proposal");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleSubmitProposal = async (proposalId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/proposals/${proposalId}/submit`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.ok) {
        toast.success("Proposal submitted for review!");
        fetchProposals();
      } else {
        toast.error("Failed to submit proposal");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-white">Syncing Proposals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-alward-blue" />
          Proposals & Milestones
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-alward-blue text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-all"
        >
          <Plus size={16} /> New Proposal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposals.map((p) => (
          <div key={p.id} className="glass-card-premium rounded-xl overflow-hidden hover:shadow-lg transition-all p-5 text-white">
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                p.status === 'locked' ? 'bg-alward-emerald/20 text-alward-emerald border-alward-emerald' : 
                p.status === 'draft' ? 'bg-slate-800 text-slate-300 border-slate-600' :
                'bg-yellow-500/20 text-yellow-500 border-yellow-500'
              }`}>
                {p.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-bold text-alward-blue">Version {p.version_number}</span>
            </div>
            
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <DollarSign size={16} className="text-alward-emerald" /> 
              Goal: ${p.funding_goal.toLocaleString()}
            </h3>
            
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Milestones ({p.milestones?.length || 0})</p>
              {p.milestones?.slice(0, 2).map((m, idx) => (
                <div key={idx} className="text-sm mb-1 flex justify-between">
                  <span>{m.title}</span>
                  <span className="text-alward-emerald">${m.amount}</span>
                </div>
              ))}
              {p.milestones?.length > 2 && <div className="text-xs text-slate-500 italic mt-1">+ {p.milestones.length - 2} more...</div>}
            </div>

            {p.status === 'draft' && (
              <button 
                onClick={() => handleSubmitProposal(p.id)}
                className="mt-6 w-full btn-alward-primary py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Send size={14} /> Submit for Review
              </button>
            )}
            {p.status === 'locked' && (
              <div className="mt-6 text-center text-[10px] font-bold text-alward-emerald uppercase tracking-widest border border-alward-emerald/30 bg-alward-emerald/10 py-3 rounded-lg">
                <CheckCircle size={14} className="inline mr-1" /> Approved & Locked
              </div>
            )}
          </div>
        ))}
        {proposals.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 border border-white/10 rounded-xl bg-white/5">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No proposals created yet.</p>
          </div>
        )}
      </div>

      {/* Add Proposal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl w-full max-w-2xl border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-alward-blue to-blue-900 p-6 text-white shrink-0">
              <h3 className="text-xl font-black uppercase tracking-widest">New Investment Proposal</h3>
              <p className="text-blue-200 text-xs mt-1">Define your funding goal and verification milestones</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="proposal-form" onSubmit={handleCreateProposal} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Funding Goal (USDC)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={fundingGoal}
                      onChange={(e) => setFundingGoal(e.target.value)}
                      className="w-full pl-10 p-3 rounded-lg bg-[#020617] border border-white/10 text-white outline-none focus:border-alward-blue transition-colors"
                      placeholder="e.g. 50000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Milestones</label>
                    <button type="button" onClick={handleAddMilestone} className="text-xs font-bold text-alward-blue hover:text-white flex items-center gap-1 transition-colors">
                      <Plus size={12} /> Add Milestone
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {milestones.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-500">Milestone {idx + 1}</span>
                          {milestones.length > 1 && (
                            <button type="button" onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 text-xs font-bold">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            placeholder="Title (e.g. Beta Release)" 
                            value={m.title}
                            onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                            className="p-2 rounded bg-[#020617] border border-white/10 text-white text-sm outline-none focus:border-alward-blue"
                            required
                          />
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="number" 
                              placeholder="Tranche Amount" 
                              value={m.amount}
                              onChange={(e) => handleMilestoneChange(idx, "amount", e.target.value)}
                              className="w-full pl-7 p-2 rounded bg-[#020617] border border-white/10 text-white text-sm outline-none focus:border-alward-blue"
                              required
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="What specifically needs to be verified by the Ground Agent?"
                          value={m.description}
                          onChange={(e) => handleMilestoneChange(idx, "description", e.target.value)}
                          className="w-full p-2 rounded bg-[#020617] border border-white/10 text-white text-sm outline-none focus:border-alward-blue h-20 resize-none"
                          required
                        ></textarea>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-[#0f172a] shrink-0 flex gap-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors rounded-xl border border-white/10 hover:bg-white/5">
                Cancel
              </button>
              <button type="submit" form="proposal-form" className="flex-1 py-3 btn-alward-primary text-xs font-bold uppercase tracking-widest rounded-xl">
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
