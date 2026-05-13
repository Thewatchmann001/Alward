import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AlwardLogo from '../components/AlwardLogo';

const ROLE_DESCRIPTIONS = {
  investor: 'Browse verified startups and invest via milestone-gated USDC escrow.',
  startup: 'Register your startup, define milestones, and receive structured funding.',
  enumerator: 'Apply to become a certified ground agent who verifies startups on-site.',
};

export default function Register() {
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

  const handlePrivySignup = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alward_pending_role', role);
      }
      await privyLogin();
    } catch (error) {
      console.error('Signup failed', error);
      toast.error('Authentication failed. Please try again.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--alward-bg)' }}>

      {/* ── Left panel — value prop ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden border-r"
        style={{ background: 'var(--alward-surface)', borderColor: 'var(--alward-border)' }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(201,160,74,0.06)' }}
        />

        <AlwardLogo size="medium" />

        <div className="relative z-10 space-y-8">
          <div>
            <div className="aw-section-label mb-3">Join the network</div>
            <h2 className="text-4xl font-bold leading-tight" style={{ color: 'var(--alward-text)' }}>
              The transparent path<br />
              <span style={{ color: 'var(--alward-gold)' }}>from capital to proof.</span>
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🔐', title: 'Escrow-secured funding', desc: 'Investor USDC is locked on-chain until milestones are verified.' },
              { icon: '🌍', title: 'Physical ground verification', desc: 'Independent agents visit startups and attest milestones on Solana.' },
              { icon: '⚡', title: 'Automatic tranche release', desc: 'Funds flow to founders only after all three parties approve.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl"
                style={{ background: 'var(--alward-surface2)', border: '1px solid var(--alward-border)' }}>
                <div className="text-xl mt-0.5">{icon}</div>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--alward-text)' }}>{title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--alward-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--alward-muted)' }}>
          © 2026 ALWARD Protocol · Non-custodial · Solana Devnet
        </p>
      </div>

      {/* ── Right panel — signup form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-10 flex justify-center">
            <AlwardLogo size="large" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--alward-text)' }}>
              Create your account
            </h1>
            <p className="text-sm" style={{ color: 'var(--alward-muted)' }}>
              Select your role to get started on ALWARD.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="aw-label">Your role</label>
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

            {/* Role description hint */}
            <div className="px-4 py-3 rounded-lg text-sm leading-relaxed"
              style={{ background: 'rgba(201,160,74,0.07)', border: '1px solid rgba(201,160,74,0.15)', color: 'var(--alward-muted)' }}>
              {ROLE_DESCRIPTIONS[role]}
            </div>

            <button
              onClick={handlePrivySignup}
              disabled={!privyReady}
              className="aw-btn-primary w-full"
              style={{ opacity: privyReady ? 1 : 0.5, cursor: privyReady ? 'pointer' : 'not-allowed' }}
            >
              {!privyReady ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create account with Privy <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--alward-muted)' }}>
              Secure authentication · Embedded wallet created automatically
            </p>

            <div className="pt-4" style={{ borderTop: '1px solid var(--alward-border)' }}>
              <p className="text-center text-sm" style={{ color: 'var(--alward-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold transition-colors duration-200"
                  style={{ color: 'var(--alward-gold)' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
