from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Milestone, ValidationReport, MilestoneStatus
from app.services.risk_scoring_engine import RiskScoringEngine
from datetime import datetime


class ValidationService:
    def __init__(self):
        self.risk_engine = RiskScoringEngine()

    def submit_validation_report(
        self,
        db: Session,
        milestone_id: int,
        agent_id: int,
        confidence_score: float,
        findings_summary: str,
        visit_date: Optional[datetime] = None,
        location_verified: Optional[str] = None
    ) -> ValidationReport:
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
        if not milestone:
            raise ValueError("Milestone not found")

        report = ValidationReport(
            milestone_id=milestone_id,
            agent_id=agent_id,
            confidence_score=confidence_score,
            findings_summary=findings_summary,
            visit_date=visit_date or datetime.utcnow(),
            location_verified=location_verified
        )
        db.add(report)
        
        # Logic: If confidence is high, mark milestone as validated
        # In a real system, this might require multiple agents or admin review
        if confidence_score > 0.7:
            milestone.status = MilestoneStatus.VALIDATED
            milestone.completed_at = datetime.utcnow()
        elif confidence_score < 0.3:
            milestone.status = MilestoneStatus.REJECTED
        
        db.commit()
        db.refresh(report)
        
        # Trigger risk score update
        self.risk_engine.calculate_risk_score(db, milestone.startup_id)
        
        return report

    def get_pending_validations(self, db: Session) -> List[Milestone]:
        """Returns milestones that have evidence but no validation report yet."""
        return db.query(Milestone).filter(
            Milestone.status == MilestoneStatus.EVIDENCE_SUBMITTED
        ).all()
