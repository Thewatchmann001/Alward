from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class ReportStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class GroundAgentReport(Base):
    __tablename__ = "ground_agent_reports"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    evidence_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(ReportStatus), default=ReportStatus.SUBMITTED)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    milestone = relationship("Milestone", back_populates="reports")
    agent = relationship("User")
