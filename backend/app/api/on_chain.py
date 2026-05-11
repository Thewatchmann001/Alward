"""
on_chain.py
ALWARD — On-Chain Investment & Milestone Sync Endpoints

These endpoints are NOT payment processors.
The Solana blockchain is the source of truth.
These routes simply mirror on-chain events into the
PostgreSQL database for dashboard display purposes.

Flow:
  1. Frontend calls Solana program (real tx) → gets signature
  2. Frontend POSTs signature here → stored in DB for UI
  3. Dashboard reads from DB, but Solana Explorer is the proof
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import User, Startup, Investment
from app.utils.logger import logger

router = APIRouter(prefix="/api/investments", tags=["on-chain"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class OnChainInvestmentRecord(BaseModel):
    """Posted by frontend after a successful on-chain USDC escrow investment."""
    startup_id: str           # startup_id string (not DB pk)
    investor_wallet: str      # Solana wallet address of investor
    amount_usdc: float
    tx_signature: str         # Solana transaction signature
    investment_id: str        # e.g. INV-12345678-ABCD
    escrow_vault: str         # Escrow vault PDA address


class OnChainMilestoneValidation(BaseModel):
    """Posted by frontend after a ground agent validates a milestone on-chain."""
    startup_id: str
    milestone_index: int
    agent_wallet: str
    confidence_score: int     # 0–100
    evidence_hash: str        # IPFS CID or SHA256
    notes: Optional[str] = None
    tx_signature: str


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/record-onchain", status_code=status.HTTP_201_CREATED)
async def record_onchain_investment(
    body: OnChainInvestmentRecord,
    db: Session = Depends(get_db),
):
    """
    Mirror a confirmed on-chain escrow investment into the database.
    Idempotent — safe to call multiple times with same tx_signature.

    The Solana Explorer is the canonical proof. This endpoint is
    purely for dashboard display synchronization.
    """
    # Idempotency: don't create duplicate if tx already recorded
    existing = db.query(Investment).filter(
        Investment.tx_signature == body.tx_signature
    ).first()
    if existing:
        logger.info(f"On-chain investment already recorded: {body.tx_signature}")
        return {
            "success": True,
            "investment_id": existing.id,
            "message": "Already recorded",
            "explorer_url": f"https://explorer.solana.com/tx/{body.tx_signature}?cluster=devnet",
        }

    # Look up startup by startup_id string
    startup = db.query(Startup).filter(
        Startup.startup_id == body.startup_id
    ).first()
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup '{body.startup_id}' not found in database.",
        )

    # Look up investor by wallet address (may not exist if they're anonymous)
    investor = db.query(User).filter(
        User.wallet_address == body.investor_wallet
    ).first()

    investment = Investment(
        startup_id=startup.id,
        investor_id=investor.id if investor else None,
        amount=body.amount_usdc,
        tx_signature=body.tx_signature,
    )
    db.add(investment)

    # Update startup total_investments
    if startup.total_investments is None:
        startup.total_investments = 0
    startup.total_investments = (startup.total_investments or 0) + body.amount_usdc

    db.commit()
    db.refresh(investment)

    logger.info(
        f"On-chain investment recorded: id={investment.id} "
        f"startup={body.startup_id} amount={body.amount_usdc} "
        f"tx={body.tx_signature}"
    )

    return {
        "success": True,
        "investment_id": investment.id,
        "amount_usdc": body.amount_usdc,
        "startup_id": body.startup_id,
        "tx_signature": body.tx_signature,
        "escrow_vault": body.escrow_vault,
        "explorer_url": f"https://explorer.solana.com/tx/{body.tx_signature}?cluster=devnet",
    }


@router.post("/milestones/validate-onchain", status_code=status.HTTP_201_CREATED)
async def record_onchain_milestone_validation(
    body: OnChainMilestoneValidation,
    db: Session = Depends(get_db),
):
    """
    Mirror a confirmed on-chain ground agent milestone attestation into the DB.
    Updates the startup's milestones_validated count for dashboard display.
    """
    # Look up startup
    startup = db.query(Startup).filter(
        Startup.startup_id == body.startup_id
    ).first()
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup '{body.startup_id}' not found.",
        )

    # Update startup's validation count
    if startup.milestones_validated is None:
        startup.milestones_validated = 0
    startup.milestones_validated = (startup.milestones_validated or 0) + 1

    # Update risk score based on confidence
    if startup.risk_score is not None:
        # Confidence contributes to reducing risk score
        reduction = (body.confidence_score / 100) * 10
        startup.risk_score = max(0, (startup.risk_score or 50) - reduction)

    db.commit()

    logger.info(
        f"On-chain milestone validation recorded: "
        f"startup={body.startup_id} milestone={body.milestone_index} "
        f"agent={body.agent_wallet} confidence={body.confidence_score} "
        f"tx={body.tx_signature}"
    )

    return {
        "success": True,
        "startup_id": body.startup_id,
        "milestone_index": body.milestone_index,
        "agent_wallet": body.agent_wallet,
        "confidence_score": body.confidence_score,
        "tx_signature": body.tx_signature,
        "explorer_url": f"https://explorer.solana.com/tx/{body.tx_signature}?cluster=devnet",
    }


@router.get("/escrow-summary/{startup_id}")
async def get_escrow_summary(
    startup_id: str,
    db: Session = Depends(get_db),
):
    """
    Get a startup's investment summary from the database.
    Real-time escrow balance should be fetched from Solana directly
    using getEscrowBalance() in the frontend hook.
    """
    startup = db.query(Startup).filter(
        Startup.startup_id == startup_id
    ).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    investments = db.query(Investment).filter(
        Investment.startup_id == startup.id
    ).all()

    return {
        "startup_id": startup_id,
        "startup_name": startup.name,
        "total_invested_db": startup.total_investments or 0,
        "investment_count": len(investments),
        "milestones_validated": startup.milestones_validated or 0,
        "risk_score": startup.risk_score,
        "note": "For real-time escrow balance, query Solana directly via getEscrowBalance(startupId)",
    }
