import { useState, useEffect } from "react";
import { 
  Plus, 
  Target, 
  Clock, 
  CheckCircle, 
  Camera, 
  FileText, 
  Link as LinkIcon,
  Send,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function MilestoneManager({ startupId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Milestone Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Evidence Form
  const [activeMilestoneId, setActiveMilestoneId] = useState(null);
  const [evidenceType, setEvidenceType] = useState("document");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  useEffect(() => {
    if (startupId) fetchMilestones();
  }, [startupId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/startups/${startupId}/trust-dashboard`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_id: startupId,
          title,
          description,
          due_date: dueDate || null
        })
      });
      if (response.ok) {
        toast.success("Milestone created!");
        setShowAddModal(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchMilestones();
      }
    } catch (error) {
      toast.error("Failed to create milestone");
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/milestones/${activeMilestoneId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: evidenceType,
          url: evidenceUrl,
          description: "Startup submitted proof"
        })
      });
      if (response.ok) {
        toast.success("Evidence submitted for triangulation!");
        setActiveMilestoneId(null);
        setEvidenceUrl("");
        fetchMilestones();
      }
    } catch (error) {
      toast.error("Failed to submit evidence");
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Syncing Milestones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" />
          Milestones & Truth Layers
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <Plus size={16} /> Add Milestone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {milestones.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${m.status === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {m.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">Due: {new Date(m.due_date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{m.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{m.description}</p>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex -space-x-1">
                  {m.evidence?.map((e, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full bg-indigo-50 border border-white flex items-center justify-center" title={e.type}>
                      {e.type === 'media' ? <Camera size={10} className="text-indigo-600" /> : <FileText size={10} className="text-indigo-600" />}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{m.evidence?.length || 0} Evidence Layers</span>
              </div>

              <button 
                onClick={() => setActiveMilestoneId(m.id)}
                className="w-full border-2 border-dashed border-slate-200 py-3 rounded-lg text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Submit Evidence Layer
              </button>
            </div>
            
            {/* Reports List */}
            {m.reports?.length > 0 && (
              <div className="bg-slate-50 p-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ground Validation</p>
                {m.reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle size={12} className="text-emerald-500" />
                    <span>Agent verified with {(r.confidence_score * 100).toFixed(0)}% confidence</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6 text-white">
              <h3 className="text-xl font-bold">New Milestone</h3>
              <p className="text-slate-400 text-sm">Define what you're building next</p>
            </div>
            <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Prototype Beta Completion"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe exactly what success looks like..."
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Evidence Modal */}
      {activeMilestoneId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Submit Evidence Layer</h3>
              <p className="text-indigo-100 text-sm">Strengthen your triangulation score</p>
            </div>
            <form onSubmit={handleSubmitEvidence} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type of Proof</label>
                <select 
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="document">Legal/Financial Document</option>
                  <option value="media">Photo/Video Proof</option>
                  <option value="data_link">Live Data/API URL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Evidence URL</label>
                <input 
                  type="url" 
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                  required
                />
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <AlertCircle size={10} /> Link must be publicly accessible for agents to verify.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setActiveMilestoneId(null)} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Send size={16} /> Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
