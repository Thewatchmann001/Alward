from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import Milestone, Evidence, MilestoneStatus, EvidenceType, EvidenceSource
from app.services.risk_scoring_engine import RiskScoringEngine
from datetime import datetime


class MilestoneService:
    def __init__(self):
        self.risk_engine = RiskScoringEngine()

    def create_milestone(
        self, db: Session, startup_id: int, title: str, description: str, due_date: Optional[datetime] = None
    ) -> Milestone:
        milestone = Milestone(
            startup_id=startup_id,
            title=title,
            description=description,
            due_date=due_date,
            status=MilestoneStatus.PENDING
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)
        return milestone

    def submit_evidence(
        self, 
        db: Session, 
        milestone_id: int, 
        type: EvidenceType, 
        url: str, 
        description: Optional[str] = None,
        source: EvidenceSource = EvidenceSource.STARTUP,
        geotag: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> Evidence:
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
        if not milestone:
            raise ValueError("Milestone not found")

        evidence = Evidence(
            milestone_id=milestone_id,
            type=type,
            url=url,
            description=description,
            source=source,
            geotag=geotag,
            timestamp=timestamp
        )
        db.add(evidence)
        
        # Update milestone status
        milestone.status = MilestoneStatus.EVIDENCE_SUBMITTED
        
        db.commit()
        db.refresh(evidence)
        
        # Trigger risk score update
        self.risk_engine.calculate_risk_score(db, milestone.startup_id)
        
        return evidence

    def get_startup_milestones(self, db: Session, startup_id: int) -> List[Milestone]:
        return db.query(Milestone).filter(Milestone.startup_id == startup_id).all()
