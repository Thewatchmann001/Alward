# ALWARD: Your capital. Locked until the work is done.

<div align="center">

**Milestone-Gated USDC Escrow for Diaspora Investment**

_Triangulating Truth | Eliminating Asymmetry | Empowering the Global Diaspora_

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com/)
[![Anchor](https://img.shields.io/badge/Anchor-0.32-blue)](https://anchor-lang.com/)

[Vision](#-vision) • [The Model](#-the-model) • [Architecture](#-architecture) • [Deployment](#-deployment)

</div>

---

## 🎯 Overview

**ALWARD** is a milestone-gated USDC escrow protocol designed to eliminate the "Trust Tax" in emerging market investments. By locking investor capital in on-chain Solana vaults and releasing it only after physical ground verification, ALWARD ensures that diaspora capital is protected by institutional-grade code, not just promises.

### The Problem
Diaspora investors lose billions annually to information asymmetry. Funds are sent home based on trust, but founders often lack the accountability mechanisms to prove milestone execution.

### The ALWARD Solution
We replace "trust" with **Triangulated Truth**. Every dollar remains in a non-custodial escrow vault until a physical ground agent verifies the work, the platform approves the audit, and the investor signs off.

---

## ⚖️ The Triangulation of Truth

ALWARD operates on a three-pillar verification model where funds are only released when signals converge:

1.  **Ground Agents**: Independent enumerators who physically visit startups and sign on-chain attestations with photo/IPFS evidence.
2.  **Institutional Oversight**: ALWARD Protocol's internal audit layer provides a second layer of verification.
3.  **Investor Agency**: Investors retain the final gate, signing the release only when satisfied with the triangulated proof.

**Result**: A trustless execution engine for the $89B diaspora investment market.

---

## ✨ Core Features

### For Investors
- ✅ **Milestone-Gated Escrow**: Your USDC never leaves the vault until work is proven.
- ✅ **Physical Verification**: See real-world evidence (IPFS-stored) from ground agents.
- ✅ **Institutional Branding**: A premium, charcoal-and-gold interface designed for professional capital.
- ✅ **Real USDC Settlement**: No tokens, no wrappers—just real Solana USDC.

### For Startups
- ✅ **Verified Credibility**: Prove your execution to global investors with immutable proof-of-work.
- ✅ **Permissionless Tranches**: Funds flow automatically once verification is signed.
- ✅ **Global Reach**: Access diaspora capital that was previously locked behind trust barriers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Institutional Gold/Charcoal Branding
- **Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Wallets**: [@solana/wallet-adapter](https://solana.com/)

### Blockchain (Solana Devnet)
- **Framework**: [Anchor Protocol](https://anchor-lang.com/)
- **Smart Contract**: Milestone-Gated Escrow (350+ lines of Rust)
- **Currency**: USDC (SPL Token)
- **Evidence**: IPFS (Content Addressing)

---

## 🚀 Quick Start

### 1. Initialize
```bash
git clone https://github.com/alward/alward-protocol.git
cd alward-protocol
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 The Vision

ALWARD is the decentralized intelligence layer for global investments. We are building the infrastructure that allows capital to flow to the most deserving founders in emerging markets, secured by the speed and transparency of the Solana blockchain.

---

*Built for the Solana Hackathon. Institutional Trust. On-Chain Truth.*
