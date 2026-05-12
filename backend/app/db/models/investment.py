from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposal_version_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    amount = Column(Float, nullable=False)  # USDC amount
    escrow_pda_address = Column(String(88), nullable=True)  # Solana PDA address
    status = Column(String(50), default="pending")
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    proposal = relationship("Proposal", back_populates="investments")
    investor = relationship("User", back_populates="investments")

