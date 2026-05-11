"""
Startup Verification Module
Handles blockchain-based startup verification and vetting.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import sys
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.blockchain.startup_client import StartupClient
from app.services.credibility_service import CredibilityService
from app.services.risk_scoring_engine import RiskScoringEngine
from app.services.milestone_service import MilestoneService
from app.services.validation_service import ValidationService
from app.db.models import Startup, User, Milestone, Evidence, ValidationReport
from app.utils.logger import logger


class StartupVerification:
    """Startup verification service using blockchain."""
    
    def __init__(self):
        self.startup_client = StartupClient()
        self.credibility_service = CredibilityService()
        self.risk_engine = RiskScoringEngine()
        self.milestone_service = MilestoneService()
        self.validation_service = ValidationService()
    
    def verify_startup(
        self,
        startup_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Verify a startup on the blockchain.
        
        Returns:
            Verification result with blockchain proof
        """
        logger.info(f"Verifying startup: {startup_id}")
        
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise ValueError(f"Startup {startup_id} not found")
        
        # Get blockchain data
        blockchain_data = self.startup_client.get_startup_data(startup_id)
        
        # Calculate credibility score
        self.credibility_service.calculate_startup_credibility(db, startup.id)
        db.refresh(startup)
        
        return {
            "startup_id": startup_id,
            "verified": blockchain_data.get("verified", False),
            "on_chain": blockchain_data.get("on_chain", False),
            "credibility_score": startup.credibility_score,
            "transaction_signature": startup.transaction_signature,
            "blockchain_proof": blockchain_data
        }
    
    def list_verified_startups(
        self,
        skip: int = 0,
        limit: int = 100,
        sector: Optional[str] = None,
        min_credibility: float = 0.0,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        List verified startups with filtering options.
        
        Returns:
            List of verified startups
        """
        logger.info(f"Listing verified startups (skip={skip}, limit={limit})")
        
        query = db.query(Startup).filter(
            Startup.transaction_signature.isnot(None),
            Startup.credibility_score >= min_credibility,
            Startup.status == "approved"
        )
        
        if sector:
            query = query.filter(Startup.sector.ilike(f"%{sector}%"))
        
        startups = query.offset(skip).limit(limit).all()
        
        result = []
        for startup in startups:
            result.append({
                "id": startup.id,
                "startup_id": startup.startup_id,
                "founder_id": startup.founder_id,  # Include founder_id for attestation fetching
                "name": startup.name,
                "sector": startup.sector,
                "country": startup.country,
                "credibility_score": startup.credibility_score,
                "funding_goal": startup.funding_goal,
                "description": startup.description,
                "transaction_signature": startup.transaction_signature,
                "verified": True,
                "on_chain": True
            })
        
        return result
    
    def get_startup_details(
        self,
        startup_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Get detailed startup information with verification proof.
        
        Returns:
            Detailed startup information
        """
        logger.info(f"Getting startup details: {startup_id}")
        
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise ValueError(f"Startup {startup_id} not found")
        
        # Get founder
        founder = db.query(User).filter(User.id == startup.founder_id).first()
        
        # Get blockchain verification
        blockchain_data = self.startup_client.get_startup_data(startup_id)
        
        return {
            "id": startup.id,
            "startup_id": startup.startup_id,
            "founder_id": startup.founder_id,  # Include founder_id for attestation fetching
            "name": startup.name,
            "sector": startup.sector,
            "country": startup.country,
            "description": startup.description,
            "funding_goal": startup.funding_goal,
            "pitch_deck_url": startup.pitch_deck_url,
            "credibility_score": startup.credibility_score,
            "employees_verified": startup.employees_verified,
            "transaction_signature": startup.transaction_signature,
            "founder": {
                "id": founder.id if founder else None,
                "name": founder.full_name if founder else None,
                "email": founder.email if founder else None,
                "wallet_address": founder.wallet_address if founder else None
            },
            "website": startup.website,
            "contact_email": startup.contact_email,
            "phone": startup.phone,
            "address": startup.address,
            "year_founded": startup.year_founded,
            "team_size": startup.team_size,
            "mission": startup.mission,
            "vision": startup.vision,
            "products_services": startup.products_services,
            "verified": blockchain_data.get("verified", False),
            "on_chain": blockchain_data.get("on_chain", False),
            "blockchain_proof": blockchain_data,
            "created_at": startup.created_at.isoformat() if startup.created_at else None
        }

    def get_trust_intelligence_dashboard(
        self,
        startup_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Get the unified Triangulation of Truth dashboard data.
        """
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            raise ValueError(f"Startup {startup_id} not found")

        # Recalculate Risk Score
        risk_data = self.risk_engine.calculate_risk_score(db, startup_id)
        
        # Get Milestones with evidence and reports
        milestones = db.query(Milestone).filter(Milestone.startup_id == startup_id).all()
        milestone_list = []
        for m in milestones:
            evidence = db.query(Evidence).filter(Evidence.milestone_id == m.id).all()
            reports = db.query(ValidationReport).filter(ValidationReport.milestone_id == m.id).all()
            
            milestone_list.append({
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "status": m.status,
                "due_date": m.due_date.isoformat() if m.due_date else None,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "evidence_count": len(evidence),
                "validation_count": len(reports),
                "evidence": [
                    {
                        "id": e.id,
                        "type": e.type,
                        "source": e.source,
                        "url": e.url,
                        "geotag": e.geotag,
                        "timestamp": e.timestamp.isoformat() if e.timestamp else None
                    } for e in evidence
                ],
                "reports": [
                    {
                        "id": r.id,
                        "agent_id": r.agent_id,
                        "confidence_score": r.confidence_score,
                        "findings": r.findings_summary,
                        "visit_date": r.visit_date.isoformat() if r.visit_date else None
                    } for r in reports
                ]
            })

        return {
            "startup_id": startup_id,
            "startup_name": startup.name,
            "risk_score": risk_data["risk_score"],
            "risk_summary": risk_data,
            "milestones": milestone_list,
            "philosophy": "A structured intelligence layer that reduces uncertainty in capital allocation through layered verification and risk scoring."
        }

