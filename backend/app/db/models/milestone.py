from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class MilestoneStatus(str, enum.Enum):
    PENDING = "pending"
    AGENT_VERIFIED = "agent_verified"
    ADMIN_VERIFIED = "admin_verified"
    PAID = "paid"


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    proposal_version_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    startup_id = Column(Integer, ForeignKey("startups.id"), nullable=True) # Optional link for direct querying
    alward_approved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    proposal = relationship("Proposal", back_populates="milestones")
    startup = relationship("Startup", back_populates="milestones")
    reports = relationship("GroundAgentReport", back_populates="milestone", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="milestone", cascade="all, delete-orphan")
