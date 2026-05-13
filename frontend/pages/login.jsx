import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AlwardLogo from '../components/AlwardLogo';

export default function Login() {
  const { user, isAuthenticated } = useAuth();
  const { login: privyLogin, authenticated: privyAuthenticated, ready: privyReady } = usePrivyAuth();
  const router = useRouter();
  const [role, setRole] = useState('investor');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAuthenticated && user && privyAuthenticated) {
      router.push(
        user.role === 'founder' || user.role === 'startup'
          ? '/startup-dashboard'
          : '/investor-platform'
      );
    }
  }, [isAuthenticated, user, privyAuthenticated, router]);

  const handlePrivyLogin = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alward_pending_role', role);
      }
      await privyLogin();
    } catch (error) {
      console.error('Login failed', error);
      toast.error('Authentication failed. Please try again.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--alward-bg)' }}>

      {/* ── Left panel — brand statement ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden border-r"
        style={{ background: 'var(--alward-surface)', borderColor: 'var(--alward-border)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(201,160,74,0.07)' }}
        />

        <AlwardLogo size="medium" />

        <div className="relative z-10 space-y-6">
          <div className="aw-section-label">Investment Protocol</div>
          <h2 className="text-4xl font-bold leading-tight" style={{ color: 'var(--alward-text)' }}>
            Capital secured by<br />
            <span style={{ color: 'var(--alward-gold)' }}>on-chain verification.</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--alward-muted)' }}>
            Every investment is milestone-gated and physically verified by independent
            ground agents before funds are released.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { value: '$89B', label: 'Diaspora market' },
              { value: '3-of-3', label: 'Approval threshold' },
              { value: '0', label: 'ALWARD can touch' },
              { value: '100%', label: 'On-chain proof' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="p-4 rounded-xl"
                style={{ background: 'var(--alward-surface2)', border: '1px solid var(--alward-border)' }}
              >
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--alward-gold)' }}>{value}</div>
                <div className="text-xs" style={{ color: 'var(--alward-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--alward-muted)' }}>
          © 2026 ALWARD Protocol · Non-custodial · Solana Devnet
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <AlwardLogo size="large" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--alward-text)' }}>
              Sign in to ALWARD
            </h1>
            <p className="text-sm" style={{ color: 'var(--alward-muted)' }}>
              Select your role and authenticate securely via Privy.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="aw-label">Access role</label>
              <select
                className="aw-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                <option value="investor">Diaspora Investor</option>
                <option value="startup">Startup Founder</option>
                <option value="enumerator">Ground Agent</option>
              </select>
            </div>

            <button
              onClick={handlePrivyLogin}
              disabled={!privyReady}
              className="aw-btn-primary w-full"
              style={{ opacity: privyReady ? 1 : 0.5, cursor: privyReady ? 'pointer' : 'not-allowed' }}
            >
              {!privyReady ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Continue with Privy <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--alward-muted)' }}>
              Secure authentication · Wallet created automatically
            </p>

            <div className="pt-4" style={{ borderTop: '1px solid var(--alward-border)' }}>
              <p className="text-center text-sm" style={{ color: 'var(--alward-muted)' }}>
                New to ALWARD?{' '}
                <Link
                  href="/register"
                  className="font-semibold transition-colors"
                  style={{ color: 'var(--alward-gold)' }}
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
