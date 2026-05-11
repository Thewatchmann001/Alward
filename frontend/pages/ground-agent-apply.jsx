import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Shield, MapPin, Send, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";

export default function GroundAgentApply() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    experience: "",
    location: "",
    motivation: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "enumerator") {
      router.push("/ground-agent");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token"); // AuthContext uses "token"
      
      const res = await fetch(`${apiUrl}/api/ground-agents/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Application submitted successfully!");
        setSubmitted(true);
      } else {
        toast.error(data.detail || "Failed to submit application");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30"
        >
          <CheckCircle className="text-emerald-400" size={40} />
        </motion.div>
        <h1 className="text-3xl font-black italic mb-4 uppercase tracking-tighter">Application Received</h1>
        <p className="text-slate-400 max-w-md mb-8 text-sm">
          Your application to join the Ground Agent network is now being reviewed by our Superadmins. 
          You will be notified once your role is granted.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-emerald-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <nav className="p-8 relative z-10">
        <Logo size="medium" />
      </nav>
      
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="text-emerald-400" size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">
              Network Expansion
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-6 leading-[0.9]">
            Join the <br /> Ground Intelligence <br /> Network
          </h1>
          
          <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed">
            Ground Agents are the vital "Triangulation of Truth" layer. You physically verify milestones 
            and sign on-chain attestations to release capital.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-8 bg-white/[0.03] border border-white/5 p-8 rounded-[2rem]">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Primary Location / Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="e.g. Lagos, Nigeria / Nairobi, Kenya"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-emerald-500/50 focus:bg-white/[0.08] outline-none transition-all text-sm font-medium"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Relevant Experience
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Briefly describe your background in field validation, auditing, or relevant local knowledge..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-emerald-500/50 focus:bg-white/[0.08] outline-none transition-all resize-none text-sm font-medium leading-relaxed"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                Why do you want to be a Ground Agent?
              </label>
              <textarea 
                required
                rows={3}
                placeholder="Tell us about your motivation to secure global investments..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:border-emerald-500/50 focus:bg-white/[0.08] outline-none transition-all resize-none text-sm font-medium leading-relaxed"
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-emerald-900/20"
            >
              {submitting ? (
                <Clock className="animate-spin" size={18} />
              ) : (
                <>Submit Application <Send size={18} /></>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
