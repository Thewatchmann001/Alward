from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"), nullable=False)
    investor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)  # USDC amount
    tx_signature = Column(String(88), nullable=False)  # Solana transaction signature
    investment_id = Column(String(50), nullable=True) # ID used on-chain for the PDA
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    startup = relationship("Startup", back_populates="investments")
    investor = relationship("User", back_populates="investments")

