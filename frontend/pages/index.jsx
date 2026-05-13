import Link from "next/link";
import {
  Shield, Lock, ArrowRight, Globe, CheckCircle, MapPin, ExternalLink, TrendingUp
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Logo from "../components/Logo";
import { useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const HOW_IT_WORKS = [
  {
    num: "01",
    role: "Startup Founder",
    color: "#C9A04A",
    title: "Register & define milestones",
    desc: "Create your startup profile and define up to 10 measurable milestones. Your funding goal is locked into a smart contract escrow vault — not held by ALWARD.",
  },
  {
    num: "02",
    role: "Investor",
    color: "#3B82F6",
    title: "Invest with USDC",
    desc: "Connect your Phantom wallet and sign one transaction. Your USDC moves directly from your wallet into an on-chain program vault. No intermediaries.",
  },
  {
    num: "03",
    role: "Ground Agent",
    color: "#10B981",
    title: "Physical field verification",
    desc: "A trained ground agent visits the startup, verifies the milestone, uploads photo evidence to IPFS, and signs an on-chain attestation.",
  },
  {
    num: "04",
    role: "Smart Contract",
    color: "#C9A04A",
    title: "Automatic tranche release",
    desc: "Once all three parties sign (agent + ALWARD + investor), the contract releases a proportional USDC tranche to the founder — permissionlessly and irreversibly.",
  },
];

const STATS = [
  { value: "$89B", label: "Diaspora remittances annually", sub: "with zero trusted investment layer" },
  { value: "3-of-3", label: "Approval threshold", sub: "agent + platform + investor" },
  { value: "$0", label: "ALWARD can access", sub: "non-custodial by design" },
];

const ESCROW_STEPS = [
  { label: "Investor signs", detail: "500 USDC → Escrow Vault PDA", icon: "🔐", done: true },
  { label: "Ground Agent attests", detail: "IPFS CID + confidence 94% → Solana", icon: "🌍", done: true },
  { label: "ALWARD countersigns", detail: "Platform approval on-chain", icon: "🛡️", done: true },
  { label: "Tranche released", detail: "$125 USDC → Founder wallet", icon: "✅", done: true },
];

export default function Home() {
  const containerRef = useRef(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -40]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden font-sans"
      style={{ background: 'var(--alward-bg)', color: 'var(--alward-text)' }}
    >
      {/* Background ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full blur-[160px]"
          style={{ background: 'rgba(201,160,74,0.04)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[160px]"
          style={{ background: 'rgba(59,130,246,0.05)' }} />
      </div>

      {/* ── Navigation ── */}
      <nav className="aw-nav px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="small" />

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--alward-muted)' }}>
            <Link href="/investor-platform" className="hover:text-white transition-colors duration-200">Invest</Link>
            <Link href="/ground-agent-apply" className="hover:text-white transition-colors duration-200"
              style={{ color: 'var(--alward-label)' }}>Become an Agent</Link>
            <Link href="/startup-onboarding" className="hover:text-white transition-colors duration-200">List Your Startup</Link>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link
                href="/admin-dashboard"
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                style={{ color: 'var(--alward-gold)' }}
              >
                <Shield size={13} /> Admin
              </Link>
            )}
            <Link
              href="/login"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'var(--alward-muted)' }}
            >
              Sign in
            </Link>
            <Link href="/register" className="aw-btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative pt-36 pb-28 px-6 flex flex-col items-center justify-center text-center z-10 min-h-screen"
      >
        {/* Live badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <span className="aw-badge aw-badge-gold">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--alward-gold)' }} />
            Live on Solana Devnet
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6 max-w-4xl"
        >
          Milestone-gated investment,<br />
          <span style={{ color: 'var(--alward-gold)' }}>verified on the ground.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl text-lg mb-12 leading-relaxed font-light"
          style={{ color: 'var(--alward-muted)' }}
        >
          ALWARD locks investor USDC in a Solana smart contract. A physical ground agent visits
          the startup and verifies each milestone on-chain. Funds only flow to founders after
          all three parties approve — no promises, no trust required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link href="/investor-platform" className="aw-btn-primary">
            Explore Startups <ArrowRight size={16} />
          </Link>
          <Link href="/ground-agent-apply" className="aw-btn-secondary">
            <MapPin size={15} style={{ color: '#34D399' }} /> Become a Ground Agent
          </Link>
        </motion.div>

        {/* Contract address */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-14 flex items-center gap-2 text-xs font-mono"
          style={{ color: 'var(--alward-muted)' }}
        >
          <Lock size={11} style={{ color: 'var(--alward-gold)' }} />
          <span>Escrow Program: ESCRmwcXk7qzL8YvhNbDqNRp2xzVgAR7SoYbHqHZkaDx</span>
          <a
            href="https://explorer.solana.com/address/ESCRmwcXk7qzL8YvhNbDqNRp2xzVgAR7SoYbHqHZkaDx?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-200"
            style={{ color: 'var(--alward-gold)' }}
          >
            <ExternalLink size={11} />
          </a>
        </motion.div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="py-20 relative z-10" style={{ background: 'var(--alward-surface)', borderTop: '1px solid var(--alward-border)', borderBottom: '1px solid var(--alward-border)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            style={{ '--tw-divide-opacity': 1, borderColor: 'var(--alward-border)' }}>
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 text-center"
              >
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--alward-gold)' }}>{s.value}</div>
                <div className="text-white font-semibold mb-1">{s.label}</div>
                <div className="text-xs" style={{ color: 'var(--alward-muted)' }}>{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-28 relative z-10" style={{ borderTop: '1px solid var(--alward-border)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="aw-section-label mb-3">The Triangulation of Truth</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Three signals. One release.
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: 'var(--alward-muted)' }}>
              No single party can release funds alone. The blockchain enforces it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="aw-card-hover p-7 group"
              >
                <div className="flex items-start gap-5">
                  <div
                    className="text-4xl font-bold flex-shrink-0 leading-none opacity-25 group-hover:opacity-50 transition-opacity duration-200"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <div className="mb-2" style={{ color: step.color, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {step.role}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--alward-muted)' }}>{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem / Market ── */}
      <section className="py-28 relative z-10" style={{ background: 'var(--alward-surface)', borderTop: '1px solid var(--alward-border)' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="aw-section-label mb-4">The $89 Billion problem</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
              Diaspora investors<br />are flying blind.
            </h2>
            <div className="space-y-4 text-base leading-relaxed" style={{ color: 'var(--alward-muted)' }}>
              <p>
                Africans and Asians abroad send billions home every year, investing in the next
                generation of their home country's economy. Too often they lose it to founders
                who claim milestones they never hit.
              </p>
              <p>
                Existing platforms offer no escrow, no verification, and no ground truth.
                Your money leaves your wallet and enters a promise.
              </p>
              <p className="font-medium" style={{ color: 'var(--alward-text)' }}>
                ALWARD replaces promises with proof. Every dollar in escrow.
                Every milestone physically verified. Every release on-chain.
              </p>
            </div>
            <Link href="/register" className="aw-btn-primary mt-8 inline-flex">
              Join the protocol <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Live escrow flow panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="aw-card p-7 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <div className="aw-section-label" style={{ marginBottom: 0 }}>Live escrow flow</div>
                <span className="aw-badge aw-badge-green">Live</span>
              </div>

              {ESCROW_STEPS.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-2"
                  style={{ borderBottom: i < ESCROW_STEPS.length - 1 ? '1px solid var(--alward-border)' : 'none' }}>
                  <div className="text-xl flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--alward-muted)' }}>{item.detail}</div>
                  </div>
                  <CheckCircle size={15} style={{ color: 'var(--alward-gold)', flexShrink: 0 }} />
                </div>
              ))}

              <div className="pt-2">
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold transition-colors duration-200"
                  style={{ color: 'var(--alward-gold)' }}
                >
                  <ExternalLink size={12} /> Verify on Solana Explorer
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 relative z-10 text-center" style={{ borderTop: '1px solid var(--alward-border)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="aw-section-label mb-4">Get started</div>
            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-5">
              No trust required.<br />
              <span style={{ color: 'var(--alward-gold)' }}>Just proof.</span>
            </h2>
            <p className="text-lg mb-10" style={{ color: 'var(--alward-muted)' }}>
              Join the protocol that puts physical ground truth between investors and founders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/investor-platform" className="aw-btn-primary">
                Explore startups <ArrowRight size={16} />
              </Link>
              <Link href="/startup-onboarding" className="aw-btn-secondary">
                List your startup
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 relative z-10" style={{ background: 'var(--alward-surface)', borderTop: '1px solid var(--alward-border)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-5">
          <Logo size="small" />
          <p className="text-xs text-center" style={{ color: 'var(--alward-muted)' }}>
            © 2026 ALWARD Protocol. Non-custodial. All transactions on Solana Devnet.
          </p>
          <div className="flex gap-6 text-xs" style={{ color: 'var(--alward-muted)' }}>
            <Link href="/investor-platform" className="hover:text-white transition-colors duration-200">Invest</Link>
            <Link href="/ground-agent-apply" className="hover:text-white transition-colors duration-200">Agents</Link>
            <Link href="/startup-onboarding" className="hover:text-white transition-colors duration-200">Founders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
