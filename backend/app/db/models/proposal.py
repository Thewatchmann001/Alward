from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_ADMIN = "pending_admin"
    LOCKED = "locked"
    REJECTED = "rejected"

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"), nullable=False)
    version_number = Column(Integer, default=1, nullable=False)
    funding_goal = Column(Float, nullable=False)  # USDC amount
    status = Column(Enum(ProposalStatus), default=ProposalStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    startup = relationship("Startup", back_populates="proposals")
    milestones = relationship("Milestone", back_populates="proposal", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="proposal", cascade="all, delete-orphan")
