import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AlwardLogo from '../components/AlwardLogo';

export default function Register() {
  const { user, isAuthenticated } = useAuth();
  const { login: privyLogin, authenticated: privyAuthenticated, ready: privyReady } = usePrivyAuth();
  const router = useRouter();
  const [role, setRole] = useState('investor');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If fully authenticated with backend and Privy
    if (isAuthenticated && user && privyAuthenticated) {
      router.push(user.role === 'founder' || user.role === 'startup' ? '/startup-dashboard' : '/investor-platform');
    }
  }, [isAuthenticated, user, privyAuthenticated, router]);

  const handlePrivySignup = async () => {
    try {
      // Store the requested role so it can be used during backend sync
      if (typeof window !== 'undefined') {
        localStorage.setItem('alward_pending_role', role);
      }
      
      // Trigger Privy login modal
      await privyLogin();
    } catch (error) {
      console.error("Signup failed", error);
      toast.error("Authentication failed. Please try again.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full z-10"
      >
        <div className="text-center mb-10 flex flex-col items-center justify-center">
          <AlwardLogo size="large" className="mb-6 justify-center" />
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mt-4">Create Account</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Join the Alward Network</p>
        </div>

        <div className="bg-white p-10 rounded-[2rem] space-y-6 shadow-xl border border-slate-100">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Select Your Role</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="investor">DIASPORA INVESTOR</option>
              <option value="startup">STARTUP FOUNDER</option>
              <option value="enumerator">GROUND AGENT</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              onClick={handlePrivySignup}
              disabled={!privyReady}
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {!privyReady ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  CONTINUE WITH PRIVY <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-semibold mt-4">
              Secure global login. Wallet created automatically.
            </p>
          </div>

          <div className="text-center pt-2 border-t border-slate-100 mt-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
