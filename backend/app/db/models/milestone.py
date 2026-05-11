from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class MilestoneStatus(str, enum.Enum):
    PENDING = "pending"
    EVIDENCE_SUBMITTED = "evidence_submitted"
    VALIDATED = "validated"
    REJECTED = "rejected"
    DISPUTED = "disputed"


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    startup_id = Column(Integer, ForeignKey("startups.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(MilestoneStatus), default=MilestoneStatus.PENDING)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    alward_approved = Column(Boolean, default=False)
    
    
    # Financial metrics for this milestone (if applicable)
    target_amount = Column(Float, nullable=True)  # e.g., "Raise $10k" or "Spend $5k"
    actual_amount = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    startup = relationship("Startup", back_populates="milestones")
    evidence = relationship("Evidence", back_populates="milestone", cascade="all, delete-orphan")
    validation_reports = relationship("ValidationReport", back_populates="milestone", cascade="all, delete-orphan")
