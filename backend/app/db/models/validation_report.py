from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class ValidationReport(Base):
    __tablename__ = "validation_reports"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Quantitative Assessment
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    
    # Qualitative Assessment
    findings_summary = Column(Text, nullable=False)
    evidence_urls = Column(Text, nullable=True)  # Semicolon separated list or JSON
    
    # Verification Details
    visit_date = Column(DateTime, nullable=True)
    location_verified = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    milestone = relationship("Milestone", back_populates="validation_reports")
    agent = relationship("User")
