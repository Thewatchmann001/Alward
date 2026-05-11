from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class EvidenceType(str, enum.Enum):
    DOCUMENT = "document"
    MEDIA = "media"  # Photos/Videos
    DATA_LINK = "data_link"  # SaaS integration/Transaction record
    SOCIAL_PROOF = "social_proof"


class EvidenceSource(str, enum.Enum):
    STARTUP = "startup"
    SAAS_LAYER = "saas_layer"
    THIRD_PARTY = "third_party"


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("milestones.id"), nullable=False)
    type = Column(Enum(EvidenceType), nullable=False)
    source = Column(Enum(EvidenceSource), nullable=False)
    
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Transparency Metadata
    geotag = Column(String(100), nullable=True)  # "lat,long"
    timestamp = Column(DateTime, nullable=True)  # Evidence creation time (e.g. from photo EXIF)
    
    # Raw data for automated consistency checks
    raw_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    milestone = relationship("Milestone", back_populates="evidence")
