from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import Startup, Milestone, Evidence, GroundAgentReport, MilestoneStatus, EvidenceSource
from app.utils.logger import logger
from datetime import datetime


class RiskScoringEngine:
    """
    ALWARD CORE: Dynamic Risk Scoring Engine
    Triangulates multiple sources of truth to generate advisory investment intelligence.
    """

    def calculate_risk_score(self, db: Session, startup_id: int) -> Dict[str, Any]:
        """
        Calculate dynamic risk score (0-100, where 0 is low risk, 100 is high risk).
        """
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            return {"error": "Startup not found"}

        logger.info(f"ALWARD CORE: Running risk assessment for {startup.name}")

        # Layer 1: Consistency (Startup vs Ground Agent) - 40%
        consistency_score = self._calculate_consistency_score(db, startup_id)
        
        # Layer 2: Milestone Velocity - 20%
        velocity_score = self._calculate_velocity_score(db, startup_id)
        
        # Layer 3: Agent Confidence - 20%
        agent_trust_score = self._calculate_agent_trust_score(db, startup_id)
        
        # Layer 4: Data Layer Integrity (Geotags, Timestamps) - 20%
        data_integrity_score = self._calculate_data_integrity_score(db, startup_id)

        # Final Weighted Calculation
        # We start with 100 (Highest Risk) and subtract based on positive evidence
        # Or start with 0 and add risk points?
        # Let's use a "Confidence Index" (0-100, 100=Max Confidence) then Risk = 100 - Confidence
        
        confidence_index = (
            (consistency_score * 0.4) +
            (velocity_score * 0.2) +
            (agent_trust_score * 0.2) +
            (data_integrity_score * 0.2)
        )

        risk_score = max(0, 100 - confidence_index)
        
        # Prepare triangulation summary
        summary = {
            "risk_score": round(risk_score, 2),
            "confidence_index": round(confidence_index, 2),
            "layers": {
                "consistency": round(consistency_score, 2),
                "velocity": round(velocity_score, 2),
                "agent_validation": round(agent_trust_score, 2),
                "data_integrity": round(data_integrity_score, 2)
            },
            "assessment": self._get_assessment_text(risk_score),
            "updated_at": datetime.utcnow().isoformat()
        }

        # Update startup record
        startup.risk_score = risk_score
        startup.verification_summary = summary
        db.commit()

        return summary

    def _calculate_consistency_score(self, db: Session, startup_id: int) -> float:
        """Compares reported financial/metric data vs verified ground data."""
        milestones = db.query(Milestone).filter(
            Milestone.startup_id == startup_id,
            Milestone.status == MilestoneStatus.VALIDATED
        ).all()
        
        if not milestones:
            return 0.0  # No validated milestones = low confidence
            
        total_deviation = 0.0
        comparisons = 0
        
        for m in milestones:
            reports = db.query(GroundAgentReport).filter(GroundAgentReport.milestone_id == m.id).all()
            for r in reports:
                # If milestone has target/actual amounts, we compare
                if m.target_amount and m.actual_amount:
                    # Logic: if agent finds amount matches or is close
                    # For now, we use a placeholder logic based on confidence_score
                    total_deviation += r.confidence_score
                    comparisons += 1
        
        if comparisons == 0:
            return 50.0  # Neutral if we have validated milestones but no specific data comparisons
            
        return (total_deviation / comparisons) * 100

    def _calculate_velocity_score(self, db: Session, startup_id: int) -> float:
        """Measures frequency and timeliness of milestone completion."""
        milestones = db.query(Milestone).filter(Milestone.startup_id == startup_id).all()
        if not milestones:
            return 0.0
            
        completed = [m for m in milestones if m.status == MilestoneStatus.VALIDATED]
        if not completed:
            return 10.0 # Some points just for existing?
            
        completion_rate = len(completed) / len(milestones)
        
        # Timeliness check
        on_time_count = 0
        for m in completed:
            if m.completed_at and m.due_date and m.completed_at <= m.due_date:
                on_time_count += 1
        
        timeliness_rate = on_time_count / len(completed) if completed else 0
        
        return (completion_rate * 60) + (timeliness_rate * 40)

    def _calculate_agent_trust_score(self, db: Session, startup_id: int) -> float:
        """Aggregates confidence scores from independent ground agents."""
        reports = db.query(GroundAgentReport).join(Milestone).filter(
            Milestone.startup_id == startup_id
        ).all()
        
        if not reports:
            return 0.0
            
        avg_confidence = sum(r.confidence_score for r in reports) / len(reports)
        return avg_confidence * 100

    def _calculate_data_integrity_score(self, db: Session, startup_id: int) -> float:
        """Checks for geotags, timestamps, and SaaS data consistency."""
        evidences = db.query(Evidence).join(Milestone).filter(
            Milestone.startup_id == startup_id
        ).all()
        
        if not evidences:
            return 0.0
            
        integrity_points = 0
        total_evidences = len(evidences)
        
        for e in evidences:
            if e.geotag: integrity_points += 0.4
            if e.timestamp: integrity_points += 0.4
            if e.source == EvidenceSource.SAAS_LAYER: integrity_points += 0.2
            
        return (integrity_points / total_evidences) * 100

    def _get_assessment_text(self, risk_score: float) -> str:
        if risk_score < 20: return "Low Risk - High evidence consistency across all layers."
        if risk_score < 40: return "Moderate Risk - Consistent performance with minor validation gaps."
        if risk_score < 70: return "Elevated Risk - Inconsistent evidence or lack of ground validation."
        return "High Risk - Significant anomalies or insufficient data triangulation."
