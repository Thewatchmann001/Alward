import Link from "next/link";
import {
  Shield, Lock, ArrowRight, Globe, CheckCircle, Zap, MapPin, ExternalLink
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import Logo from "../components/Logo";
import { useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

const STEPS = [
  {
    num: "01",
    role: "Startup Founder",
    color: "#C9A04A",
    title: "Register & Set Milestones",
    desc: "Create your startup profile and define up to 10 measurable milestones. Your funding goal is locked into a smart contract escrow vault — not held by ALWARD.",
  },
  {
    num: "02",
    role: "Investor",
    color: "#2563eb",
    title: "Invest with Real USDC",
    desc: "Connect your Phantom wallet. Sign ONE transaction. Your USDC moves directly from your wallet into the on-chain PDA vault. No intermediaries. No trust required.",
  },
  {
    num: "03",
    role: "Ground Agent",
    color: "#10b981",
    title: "Physical Field Verification",
    desc: "A trained ground agent physically visits the startup, verifies the milestone, uploads photo evidence to IPFS, and signs an on-chain attestation with their wallet.",
  },
  {
    num: "04",
    role: "Smart Contract",
    color: "#C9A04A",
    title: "Automatic Tranche Release",
    desc: "Once all three parties sign (agent + ALWARD + investor), the contract releases a proportional USDC tranche to the founder — permissionlessly, provably, irreversibly.",
  },
];

const STATS = [
  { value: "$89B", label: "Diaspora remittances annually", sub: "with zero trusted investment layer" },
  { value: "3-of-3", label: "Approval threshold", sub: "agent + platform + investor" },
  { value: "0", label: "Dollars ALWARD can touch", sub: "non-custodial by design" },
];

export default function Home() {
  const containerRef = useRef(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -40]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-[#C9A04A]/30">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full bg-[#C9A04A]/4 blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[160px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-emerald-900/6 blur-[120px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="small" />
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-400">
            <Link href="/investor-platform" className="hover:text-white transition-colors">Invest</Link>
            <Link href="/ground-agent-apply" className="hover:text-[#C9A04A] transition-colors">Become an Agent</Link>
            <Link href="/startup-onboarding" className="hover:text-white transition-colors">List Your Startup</Link>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === "admin" && (
              <Link href="/admin-dashboard" className="text-[#C9A04A] text-sm font-bold uppercase tracking-widest hover:text-[#E8C97A] transition-colors flex items-center gap-2">
                <Shield size={14} /> Admin
              </Link>
            )}
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
              style={{ background: '#C9A04A', color: '#020617' }}
            >
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative pt-40 pb-32 px-6 flex flex-col items-center justify-center text-center z-10 min-h-screen"
      >
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border"
            style={{ color: '#C9A04A', borderColor: '#C9A04A33', background: '#C9A04A0D' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C9A04A' }} />
            Live on Solana Devnet
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-none mb-6"
        >
          Your capital.<br />
          <span style={{ color: '#C9A04A' }}>Locked until<br />the work is done.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl text-lg text-slate-400 mb-12 font-light leading-relaxed"
        >
          ALWARD locks investor USDC in a Solana smart contract. A physical ground agent
          visits the startup, verifies the milestone on-chain, and only then does a proportional
          tranche flow to the founder. No promises. No trust. Pure on-chain proof.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/investor-platform"
            className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(201,160,74,0.3)] hover:shadow-[0_0_50px_rgba(201,160,74,0.5)]"
            style={{ background: '#C9A04A', color: '#020617' }}
          >
            Invest in Verified Startups <ArrowRight size={16} />
          </Link>
          <Link
            href="/ground-agent-apply"
            className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 border border-white/10 text-white hover:bg-white/5 transition-all"
          >
            <MapPin size={16} className="text-emerald-400" /> Become a Ground Agent
          </Link>
        </motion.div>

        {/* Live contract badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex items-center gap-3 text-xs font-mono text-slate-600"
        >
          <Lock size={12} className="text-[#C9A04A]" />
          <span>Escrow Program: ESCRmwcXk7qzL8YvhNbDqNRp2xzVgAR7SoYbHqHZkaDx</span>
          <a
            href="https://explorer.solana.com/address/ESCRmwcXk7qzL8YvhNbDqNRp2xzVgAR7SoYbHqHZkaDx?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A04A] hover:text-[#E8C97A] transition-colors"
          >
            <ExternalLink size={10} />
          </a>
        </motion.div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="py-20 border-t border-white/5 bg-[#04091A] relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#04091A] p-12 text-center"
              >
                <div className="text-5xl font-black mb-2" style={{ color: '#C9A04A' }}>{s.value}</div>
                <div className="text-white font-bold mb-1">{s.label}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-32 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#C9A04A' }}>
              The Triangulation of Truth
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-tight">
              Three signals. One release.
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              No single party can release funds alone. The blockchain enforces it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="text-5xl font-black opacity-20 group-hover:opacity-40 transition-opacity flex-shrink-0 leading-none"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <span
                      className="text-[9px] font-black uppercase tracking-[0.3em] block mb-2"
                      style={{ color: step.color }}
                    >
                      {step.role}
                    </span>
                    <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem/Market ── */}
      <section className="py-32 relative z-10 border-t border-white/5 bg-[#04091A]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.4em] block mb-6" style={{ color: '#C9A04A' }}>
              The $89 Billion Problem
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-8">
              Diaspora investors<br />are flying blind.
            </h2>
            <div className="space-y-5 text-slate-400 leading-relaxed">
              <p>
                Africans and Asians abroad send billions home every year trying to invest in the
                next generation of their home country&apos;s economy. They lose it to founders
                who claim milestones they never hit.
              </p>
              <p>
                Existing platforms offer no escrow, no verification, and no ground truth.
                Your money leaves your wallet and enters a promise.
              </p>
              <p className="text-white font-medium">
                ALWARD replaces promises with proof. Every dollar in escrow.
                Every milestone physically verified. Every release on-chain.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-10 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all"
              style={{ background: '#C9A04A', color: '#020617' }}
            >
              Join the Protocol <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Live proof panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="p-1 rounded-2xl" style={{ background: 'linear-gradient(135deg, #C9A04A22, #C9A04A05)' }}>
              <div className="bg-[#060D1F] rounded-xl p-8 border border-white/5 space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Escrow Flow</p>

                {[
                  { label: "Investor signs", detail: "500 USDC → Escrow Vault PDA", icon: "🔐", done: true },
                  { label: "Ground Agent attests", detail: "IPFS CID + confidence 94% → Solana", icon: "🌍", done: true },
                  { label: "ALWARD signs", detail: "Platform approval on-chain", icon: "🛡️", done: true },
                  { label: "Tranche released", detail: "$125 USDC → Founder wallet", icon: "⚡", done: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="text-xl flex-shrink-0">{item.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.detail}</div>
                    </div>
                    <CheckCircle size={16} style={{ color: '#C9A04A' }} className="flex-shrink-0" />
                  </div>
                ))}

                <div className="pt-4 border-t border-white/5">
                  <a
                    href="https://explorer.solana.com/?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                    style={{ color: '#C9A04A' }}
                  >
                    <ExternalLink size={12} /> Verify on Solana Explorer
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 relative z-10 border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
              No trust required.<br />
              <span style={{ color: '#C9A04A' }}>Just proof.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join the protocol that puts physical ground truth between investors and founders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/investor-platform"
                className="px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_40px_rgba(201,160,74,0.25)] hover:shadow-[0_0_60px_rgba(201,160,74,0.4)]"
                style={{ background: '#C9A04A', color: '#020617' }}
              >
                Explore Startups
              </Link>
              <Link
                href="/startup-onboarding"
                className="px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm border border-white/10 text-white hover:bg-white/5 transition-all"
              >
                List Your Startup
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="small" />
          <p className="text-xs text-slate-600 text-center">
            © 2026 ALWARD Protocol. Non-custodial. All transactions on Solana Devnet.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/investor-platform" className="hover:text-white transition-colors">Invest</Link>
            <Link href="/ground-agent-apply" className="hover:text-white transition-colors">Agents</Link>
            <Link href="/startup-onboarding" className="hover:text-white transition-colors">Founders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
