# ALWARD Protocol — Solana Hackathon Submission

<div align="center">

**Milestone-Gated USDC Escrow for Diaspora Investment**

*The only investment platform where funds are released by physical ground truth — not promises.*

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue)](https://anchor-lang.com)
[![USDC](https://img.shields.io/badge/Token-USDC_SPL-2775CA)](https://developers.circle.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black)](https://nextjs.org)

</div>

---

## 🎯 The Problem

Diaspora investors (Africans/Asians abroad sending capital home) lose billions annually to:
- **No verification** — startups claim milestones they never hit
- **No escrow** — money goes directly to founders with no accountability
- **No ground truth** — no independent physical verification layer

Existing platforms (Kickstarter, AngelList) solve none of these for emerging markets.

---

## ⚡ What ALWARD Built on Solana

A **milestone-gated USDC escrow protocol** where:

1. **Investor** connects Phantom wallet → signs real USDC transfer to escrow vault PDA
2. **USDC is locked** in a program-controlled PDA — neither investor nor founder can touch it
3. **Ground Agent** physically verifies startup milestone → signs on-chain attestation with confidence score + IPFS evidence hash
4. **Admin (ALWARD)** approves the validation on-chain to provide institutional oversight
5. **Smart contract releases** proportional USDC tranche to founder — permissionlessly, triggered by anyone

> **No Stripe. No server wallet. No trust. Pure on-chain mechanics.**

---

## 🔗 On-Chain Addresses (Solana Devnet)

| Program | Address |
|---|---|
| **milestone_escrow** | `c9ieYuJCWPuj1uhEN4VzNSQj68GHN1qw6tNvmsb7Eed` |
| **startup_registry** | `7caediXMm5C4vNg2yLD9rD176x7kAS7JBU3d2zigKFvw` |
| `investment_ledger` | `FEQJZDk4afcXbSrRj7iW3PieNtrmeT2Hjtt5BCmoNfRr` |

---

## 🏗️ Smart Contract Architecture

```
milestone_escrow/src/lib.rs  (core — 350 lines of Anchor/Rust)
│
├── initialize_founder_config()   → Startup registers: milestone count, funding goal, USDC mint
│
├── invest_in_escrow()            → INVESTOR SIGNS: real SPL token transfer from wallet → escrow PDA vault
│   └── InvestmentRecord PDA      → Immutable on-chain record: investor pubkey, amount, timestamp
│
├── validate_milestone()          → GROUND AGENT SIGNS: confidence score (0-100) + IPFS evidence hash → MilestoneRecord PDA
│   └── MilestoneRecord PDA       → Agent pubkey, evidence hash, timestamp — permanent and immutable
│
├── alward_approve_milestone()    → ADMIN SIGNS: Provides the 'Triangulation of Truth' oversight
│
├── release_tranche()             → Permissionless: proportional USDC flows vault → founder ATA
│   └── Guards: milestone must be Validated (Agent + Admin + Investor) + tranche not yet released
│
└── refund_investor()             → Investor refund if startup hasn't started (0 milestones validated)
```

**State Accounts:**
- `FounderEscrowConfig` — per-startup: milestone count, funding goal, totals
- `InvestmentRecord` — per investment: investor, amount, timestamp
- `MilestoneRecord` — per milestone: agent, confidence, evidence hash, release flag

**Events emitted** (indexed on-chain):
- `InvestmentRecorded` — investor, amount, startup, timestamp
- `MilestoneValidated` — agent, confidence, evidence hash
- `TrancheReleased` — milestone index, amount, founder address

---

## 🎬 Hackathon Demo Flow

### Prerequisites
```bash
# Install Solana CLI + Anchor
solana config set --url devnet
solana airdrop 2

# Phantom wallet with devnet USDC (Circle faucet):
# https://faucet.circle.com
```

### Step 1 — Deploy Escrow Program
```bash
cd blockchain
npm install
anchor build
npm run deploy:escrow
```

### Step 2 — Initialize a Startup Escrow
```bash
# startup_id must match the startup_id in your database
node scripts/initFounderEscrow.js STARTUP-DEMO-001 4 50000
```
✅ Output: Escrow vault PDA created, visible on Solana Explorer

### Step 3 — Start the Platform
```bash
# Terminal 1 — Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

### Step 4 — Live Demo for Judges

| Role | Action | What Happens On-Chain |
|---|---|---|
| **Investor** | Open `/investor-platform` → Connect Phantom → Invest $500 | USDC enters escrow PDA vault. `InvestmentRecorded` event. |
| **Ground Agent** | Open `/ground-agent` → Physically verify → Submit evidence | `MilestoneRecord` PDA created. Agent attestation permanent on Solana. |
| **Admin** | Open `/admin-dashboard` → **"Sign Full Approval"** | Admin signs Steps 2 & 3 (Platform + Investor) to unlock the tranche for demo purposes. |
| **Anyone** | Click "Release Tranche" | `TransferChecked` executes. $125 USDC flows to founder wallet. `TrancheReleased` event. |
| **Verify** | Click "Solana Explorer" | All transactions visible on devnet explorer with full transparency |

---

## 📁 Project Structure

```
ALWARD/
├── blockchain/
│   ├── programs/
│   │   ├── milestone-escrow/src/lib.rs    ← CORE: 350-line Anchor escrow program
│   │   ├── startup-registry/src/lib.rs    ← Startup on-chain registration
│   │   └── investment-ledger/src/lib.rs   ← Legacy investment record
│   └── scripts/
│       ├── deployEscrow.js                ← One-command deploy
│       └── initFounderEscrow.js           ← Initialize per-startup vault
│
├── frontend/
│   ├── lib/useEscrow.js                   ← React hook: all on-chain calls
│   ├── components/Logo.jsx                ← Official ALWARD branding
│   ├── components/EscrowInvest.jsx        ← Investor UI (wallet-adapter, real USDC)
│   ├── components/GroundAgentValidate.jsx ← Agent attestation UI
│   └── pages/
│       ├── index.jsx                      ← New "Your capital. Locked." landing page
│       ├── investor-platform.jsx          ← Full investor marketplace
│       └── admin-dashboard.jsx            ← Admin control for Triple Approval
│
└── backend/
    ├── app/api/on_chain.py                ← Sync on-chain events → DB (display only)
    ├── app/services/risk_scoring_engine.py ← Alward Index calculation
    └── app/services/credibility_service.py ← Multi-layer trust scoring
```

---

## 🔑 Why This Wins

| Criterion | ALWARD |
|---|---|
| **Solana-native** | Real SPL USDC transfers, Anchor PDAs, on-chain events |
| **Novel mechanic** | Milestone-gated escrow with physical ground agent layer |
| **Real problem** | $89B diaspora remittance market — zero trusted investment layer |
| **Working demo** | Investor signs tx → Explorer shows USDC in vault → Agent validates → Admin approves → Tranche releases |
| **Branding** | Professional charcoal/gold luxury aesthetic for institutional trust |

---

## 🌍 The Vision

ALWARD is the **"Triangulation of Truth"** — three independent signals that must converge:

```
Founder Claims   ←──────┐
                         ▼
Ground Agent     ──→  ALWARD Escrow Protocol  ──→  USDC Release
                         ▲
Investor Audit   ←──────┘
```

No single party controls fund release. The blockchain enforces it.

---

*Built for the Solana Hackathon. All transactions on Solana Devnet.*
