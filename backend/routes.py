"""
Main API Routes
Exposes endpoints for Investment Platform & Startup Registry only.
(CV Builder and Job Matching removed)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
from datetime import datetime
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.session import get_db
from app.db.models import (
    User, Startup, Investment, Employee, Attestation, 
    GroundAgentApplication, ApplicationStatus, UserRole,
    Milestone, GroundAgentReport, Evidence, Proposal, ProposalStatus
)
from app.core.config import settings
from app.utils.logger import logger
from sqlalchemy import func

from investments.startup_verification import StartupVerification
from investments.usdc_transactions import USDCTransactions
from investments.investor_portfolio import InvestorPortfolio
from investments.receipt_generator import ReceiptGenerator
from app.services.qr_service import QRCodeService
from app.services.credibility_service import CredibilityService
from app.blockchain.startup_client import StartupClient
from app.services.attestation import AttestationService
from app.services.milestone_service import MilestoneService
from app.services.validation_service import ValidationService

router = APIRouter()

# Initialize services
startup_verification = StartupVerification()
usdc_transactions = USDCTransactions()
investor_portfolio = InvestorPortfolio()
receipt_generator = ReceiptGenerator()
attestation_service = AttestationService()
milestone_service = MilestoneService()
validation_service = ValidationService()


# ==================== INVESTMENT PLATFORM ENDPOINTS ====================
from app.core.dependencies import get_current_user, require_role

@router.get("/api/admin/startups/pending")
async def get_pending_startups(
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """List startups that are pending admin approval."""
    try:
        startups = db.query(Startup).filter(Startup.status == "pending").all()
        result = []
        for startup in startups:
            founder = db.query(User).filter(User.id == startup.founder_id).first()
            result.append({
                "id": startup.id,
                "startup_id": startup.startup_id,
                "name": startup.name,
                "sector": startup.sector,
                "description": startup.description,
                "status": startup.status,
                "founder_email": founder.email if founder else None,
                "created_at": startup.created_at.isoformat() if startup.created_at else None
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching pending startups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/admin/startups/{startup_id}/approve")
async def approve_startup(
    startup_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Approve a pending startup to be listed on the platform."""
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup.status = "approved"
    db.commit()
    return {"message": "Startup approved successfully", "startup_id": startup.id}

@router.post("/api/admin/startups/{startup_id}/reject")
async def reject_startup(
    startup_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Reject a pending startup."""
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
        
    startup.status = "rejected"
    db.commit()
    return {"message": "Startup rejected successfully", "startup_id": startup.id}


# ==================== GROUND AGENT ONBOARDING ====================

class GroundAgentApplyRequest(BaseModel):
    experience: str
    location: str
    motivation: str

@router.post("/api/ground-agents/apply")
async def apply_for_ground_agent(
    request: GroundAgentApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply for the Ground Agent role."""
    # Check if user already has the role
    if current_user.role == UserRole.GROUND_AGENT:
        return {"message": "You are already a Ground Agent"}
    
    # Check if there is a pending application
    existing_app = db.query(GroundAgentApplication).filter(
        GroundAgentApplication.user_id == current_user.id,
        GroundAgentApplication.status == ApplicationStatus.PENDING
    ).first()
    
    if existing_app:
        return {"message": "You already have a pending application", "status": "pending"}
    
    # Create application
    new_app = GroundAgentApplication(
        user_id=current_user.id,
        experience=request.experience,
        location=request.location,
        motivation=request.motivation,
        status=ApplicationStatus.PENDING
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    
    return {"message": "Application submitted successfully", "application_id": new_app.id}

@router.get("/api/admin/ground-agents/applications")
async def get_ground_agent_applications(
    status: Optional[str] = "pending",
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """List ground agent applications."""
    query = db.query(GroundAgentApplication)
    if status:
        query = query.filter(GroundAgentApplication.status == status)
    
    applications = query.all()
    result = []
    for app in applications:
        user = db.query(User).filter(User.id == app.user_id).first()
        result.append({
            "id": app.id,
            "user_id": app.user_id,
            "full_name": user.full_name if user else "Unknown",
            "email": user.email if user else "Unknown",
            "experience": app.experience,
            "location": app.location,
            "motivation": app.motivation,
            "status": app.status,
            "created_at": app.created_at.isoformat()
        })
    return result

@router.post("/api/admin/ground-agents/applications/{application_id}/approve")
async def approve_ground_agent_application(
    application_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Approve a ground agent application and grant the role."""
    application = db.query(GroundAgentApplication).filter(GroundAgentApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Application is already {application.status}")
    
    # Update application status
    application.status = ApplicationStatus.APPROVED
    
    # Update user role
    user = db.query(User).filter(User.id == application.user_id).first()
    if user:
        user.role = UserRole.GROUND_AGENT
    
    db.commit()
    return {"message": "Application approved and role granted"}

@router.post("/api/admin/ground-agents/applications/{application_id}/reject")
async def reject_ground_agent_application(
    application_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Reject a ground agent application."""
    application = db.query(GroundAgentApplication).filter(GroundAgentApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Application is already {application.status}")
    
    application.status = ApplicationStatus.REJECTED
    db.commit()
    return {"message": "Application rejected"}


@router.get("/api/admin/milestones/pending")
async def get_pending_admin_milestones(
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """List milestones that have been validated by agents and are awaiting ALWARD Admin approval."""
    try:
        # Assuming VALIDATED status means ready for ALWARD and not yet approved by ALWARD
        # Include milestones that are ready for admin review (validated) and not yet fully paid
        milestones = db.query(Milestone).filter(
            Milestone.status.in_(["validated", "agent_verified", "admin_verified"]),
            Milestone.status != MilestoneStatus.PAID
        ).all()
        result = []
        for m in milestones:
            startup = db.query(Startup).filter(Startup.id == m.startup_id).first()
            # Fetch validation reports
            reports = db.query(GroundAgentReport).filter(GroundAgentReport.milestone_id == m.id).all()
            
            # Since milestone index is just its position in the startup's milestones, let's calculate it
            startup_milestones = db.query(Milestone).filter(Milestone.startup_id == startup.id).order_by(Milestone.created_at).all()
            milestone_index = -1
            for idx, sm in enumerate(startup_milestones):
                if sm.id == m.id:
                    milestone_index = idx
                    break

            result.append({
                "id": m.id,
                "startup_id": startup.startup_id,
                "startup_name": startup.name,
                "title": m.title,
                "description": m.description,
                "status": m.status.value if hasattr(m.status, 'value') else m.status,
                "milestone_index": milestone_index,
                "validation_score": reports[0].confidence_score if reports else None
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching pending admin milestones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/proposals/pending")
async def get_pending_proposals(
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """List investment proposals that are pending admin approval."""
    try:
        proposals = db.query(Proposal).filter(Proposal.status == ProposalStatus.PENDING_ADMIN).all()
        result = []
        for p in proposals:
            startup = db.query(Startup).filter(Startup.id == p.startup_id).first()
            milestones = db.query(Milestone).filter(Milestone.proposal_version_id == p.id).all()
            
            result.append({
                "id": p.id,
                "startup_id": startup.startup_id,
                "startup_name": startup.name,
                "funding_goal": p.funding_goal,
                "version_number": p.version_number,
                "status": p.status.value if hasattr(p.status, 'value') else p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "milestones": [
                    {
                        "id": m.id,
                        "title": m.title,
                        "description": m.description,
                        "amount": m.amount
                    } for m in milestones
                ]
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching pending proposals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/admin/proposals/{proposal_id}/approve")
async def approve_proposal_endpoint(
    proposal_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Approve a startup's investment proposal (LOCKED status)."""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
            
        proposal.status = ProposalStatus.LOCKED
        db.commit()
        return {"message": "Proposal approved and locked", "proposal_id": proposal.id}
    except Exception as e:
        logger.error(f"Error approving proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/admin/proposals/{proposal_id}/reject")
async def reject_proposal_endpoint(
    proposal_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Reject a startup's investment proposal."""
    try:
        proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
            
        proposal.status = ProposalStatus.REJECTED
        db.commit()
        return {"message": "Proposal rejected", "proposal_id": proposal.id}
    except Exception as e:
        logger.error(f"Error rejecting proposal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/investor/milestones/pending")
async def get_pending_investor_milestones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List milestones that have been approved by ALWARD and await investor signature."""
    try:
        # Find startups the user has invested in
        investments = db.query(Investment).filter(Investment.investor_id == current_user.id).all()
        startup_ids = [inv.startup_id for inv in investments]
        
        if not startup_ids:
            return []
            
        # Get milestones for those startups that are alward_approved
        milestones = db.query(Milestone).filter(
            Milestone.startup_id.in_(startup_ids),
            Milestone.alward_approved == True
        ).all()
        
        result = []
        for m in milestones:
            startup = db.query(Startup).filter(Startup.id == m.startup_id).first()
            # Find the investment ID for this startup
            investment = next((inv for inv in investments if inv.startup_id == m.startup_id), None)
            
            # Calculate index
            startup_milestones = db.query(Milestone).filter(Milestone.startup_id == startup.id).order_by(Milestone.created_at).all()
            milestone_index = -1
            for idx, sm in enumerate(startup_milestones):
                if sm.id == m.id:
                    milestone_index = idx
                    break

            result.append({
                "id": m.id,
                "startup_id": startup.startup_id,
                "startup_name": startup.name,
                "title": m.title,
                "description": m.description,
                "milestone_index": milestone_index,
                "investment_id_onchain": investment.investment_id if investment else None
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching investor milestones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/admin/milestones/{milestone_id}/approve")
async def mark_milestone_alward_approved(
    milestone_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Mark a milestone as approved by ALWARD Admin after on-chain signature."""
    try:
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone.alward_approved = True
        db.commit()
        return {"message": "Milestone marked as approved by ALWARD Admin"}
    except Exception as e:
        logger.error(f"Error marking milestone as alward approved: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/admin/milestones/{milestone_id}/paid")
async def mark_milestone_paid(
    milestone_id: int,
    current_user: User = Depends(require_role(["admin", "superadmin", "investor"])),
    db: Session = Depends(get_db)
):
    """Mark a milestone as paid after all signatures are collected."""
    try:
        milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        
        milestone.status = MilestoneStatus.PAID
        db.commit()
        return {"message": "Milestone marked as paid"}
    except Exception as e:
        logger.error(f"Error marking milestone as paid: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/startups")
@router.get("/api/startups/list")
async def list_startups(
    skip: int = 0,
    limit: int = 100,
    sector: Optional[str] = None,
    min_credibility: float = 0.0,
    db: Session = Depends(get_db)
):
    """List verified startups available for investment."""
    try:
        startups = startup_verification.list_verified_startups(
            skip=skip,
            limit=limit,
            sector=sector,
            min_credibility=min_credibility,
            db=db
        )
        return {"startups": startups, "count": len(startups)}
    except Exception as e:
        logger.error(f"Error listing startups: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list startups: {str(e)}"
        )


@router.get("/api/startups/verify/{startup_id}")
async def verify_startup_endpoint(startup_id: str, db: Session = Depends(get_db)):
    """Verify a startup on the blockchain."""
    try:
        verification = startup_verification.verify_startup(startup_id, db)
        return verification
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error verifying startup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify startup: {str(e)}"
        )


@router.get("/api/startups/{startup_id}")
async def get_startup_details_endpoint(startup_id: str, db: Session = Depends(get_db)):
    """Get detailed startup information with verification proof."""
    try:
        details = startup_verification.get_startup_details(startup_id, db)
        return details
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting startup details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get startup details: {str(e)}"
        )


@router.get("/api/startups/{startup_id}/qr")
async def get_startup_qr_endpoint(startup_id: str, db: Session = Depends(get_db)):
    """Generate QR code for startup verification."""
    try:
        # Verify startup exists
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {startup_id} not found"
            )
        
        # Generate QR code
        qr_service = QRCodeService()
        qr_data = qr_service.generate_startup_qr(startup_id)
        
        return qr_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate QR code: {str(e)}"
        )


@router.get("/api/startups/{startup_id}/credibility-for-investor")
async def get_startup_credibility_for_investor(startup_id: str, db: Session = Depends(get_db)):
    """Get comprehensive credibility breakdown for investors."""
    try:
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {startup_id} not found"
            )
        
        credibility_service = CredibilityService()
        credibility_data = credibility_service.get_investor_credibility_view(db, startup.id)
        
        return credibility_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting investor credibility view: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get credibility information: {str(e)}"
        )


@router.post("/api/startups/{startup_id}/recalculate-credibility")
async def recalculate_credibility_endpoint(startup_id: int, db: Session = Depends(get_db)):
    """Manually trigger credibility score recalculation for a startup."""
    try:
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {startup_id} not found"
            )
        
        from app.services.credibility_service import CredibilityService
        credibility_service = CredibilityService()
        result = credibility_service.calculate_startup_credibility(db, startup_id)
        db.commit()
        db.refresh(startup)
        
        return {
            "success": True,
            "startup_id": startup_id,
            "credibility_score": startup.credibility_score,
            "factors": result.get("factors", {}),
            "grade": result.get("grade", "F")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recalculating credibility: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recalculate credibility: {str(e)}"
        )


# ==================== TRIANGULATION OF TRUTH (MILESTONES & VALIDATION) ====================

class MilestoneCreateRequest(BaseModel):
    startup_id: int
    title: str
    description: str
    due_date: Optional[datetime] = None

@router.post("/api/milestones")
async def create_milestone_endpoint(request: MilestoneCreateRequest, db: Session = Depends(get_db)):
    """Create a new business milestone for a startup."""
    try:
        milestone = milestone_service.create_milestone(
            db, request.startup_id, request.title, request.description, request.due_date
        )
        return milestone
    except Exception as e:
        logger.error(f"Error creating milestone: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class EvidenceSubmitRequest(BaseModel):
    type: str  # document, media, data_link
    url: str
    description: Optional[str] = None
    geotag: Optional[str] = None
    timestamp: Optional[datetime] = None

@router.post("/api/milestones/{milestone_id}/evidence")
async def submit_evidence_endpoint(milestone_id: int, request: EvidenceSubmitRequest, db: Session = Depends(get_db)):
    """Submit proof/evidence for a milestone."""
    try:
        evidence = milestone_service.submit_evidence(
            db, milestone_id, request.type, request.url, request.description, 
            geotag=request.geotag, timestamp=request.timestamp
        )
        return evidence
    except Exception as e:
        logger.error(f"Error submitting evidence: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ValidationReportRequest(BaseModel):
    agent_id: int
    confidence_score: float
    findings_summary: str
    location_verified: Optional[str] = None

class OnchainValidationRequest(BaseModel):
    startup_id: int
    milestone_index: int
    agent_wallet: str
    confidence_score: int
    evidence_hash: str
    notes: Optional[str] = None
    tx_signature: str

@router.post("/api/milestones/validate-onchain")
async def validate_onchain_endpoint(request: OnchainValidationRequest, db: Session = Depends(get_db)):
    """Sync on-chain validation from ground agent to backend."""
    try:
        # Find milestone by startup and index
        milestones = db.query(Milestone).filter(Milestone.startup_id == request.startup_id).order_by(Milestone.created_at).all()
        if request.milestone_index < 0 or request.milestone_index >= len(milestones):
            raise HTTPException(status_code=404, detail="Milestone index out of range")
        
        milestone = milestones[request.milestone_index]
        
        # Save validation report
        report = GroundAgentReport(
            milestone_id=milestone.id,
            agent_id=None,  # Or find user by wallet if we want
            confidence_score=request.confidence_score / 100.0,
            findings_summary=request.notes or f"On-chain validation by {request.agent_wallet}",
            visit_date=datetime.utcnow(),
            location_verified=None,
            evidence_url=request.evidence_hash, # We use evidence_hash as URL for simplicity in demo
            tx_signature=request.tx_signature
        )
        db.add(report)
        
        # Update milestone
        milestone.status = MilestoneStatus.VALIDATED
        db.commit()
        
        return {"message": "On-chain validation synced", "milestone_id": milestone.id}
    except Exception as e:
        logger.error(f"Error syncing on-chain validation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/milestones/{milestone_id}/validate")
async def validate_milestone_endpoint(milestone_id: int, request: ValidationReportRequest, db: Session = Depends(get_db)):
    """Ground agent submits physical validation for a milestone."""
    try:
        report = validation_service.submit_validation_report(
            db, milestone_id, request.agent_id, request.confidence_score, 
            request.findings_summary, location_verified=request.location_verified
        )
        return report
    except Exception as e:
        logger.error(f"Error validating milestone: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/milestones/startup/{startup_id}")
async def get_startup_milestones(startup_id: int, db: Session = Depends(get_db)):
    """List all milestones for a specific startup."""
    try:
        milestones = db.query(Milestone).filter(Milestone.startup_id == startup_id).all()
        result = []
        for m in milestones:
            # Calculate index (relative position in the startup's milestones)
            startup_milestones = db.query(Milestone).filter(Milestone.startup_id == startup_id).order_by(Milestone.created_at).all()
            milestone_index = -1
            for idx, sm in enumerate(startup_milestones):
                if sm.id == m.id:
                    milestone_index = idx
                    break

            result.append({
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "amount": m.amount,
                "status": m.status.value if hasattr(m.status, 'value') else m.status,
                "milestone_index": milestone_index,
                "alward_approved": m.alward_approved,
                "created_at": m.created_at.isoformat() if m.created_at else None
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching startup milestones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/milestones/pending-validation")
async def get_pending_validations_endpoint(db: Session = Depends(get_db)):
    """Returns milestones that have evidence but no validation report yet."""
    try:
        # Fetch milestones with status EVIDENCE_SUBMITTED
        milestones = validation_service.get_pending_validations(db)
        
        # Enrich with startup names and evidence
        result = []
        for m in milestones:
            startup = db.query(Startup).filter(Startup.id == m.startup_id).first()
            evidence = db.query(Evidence).filter(Evidence.milestone_id == m.id).all()
            result.append({
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "due_date": m.due_date.isoformat() if m.due_date else None,
                "startup_name": startup.name if startup else "Unknown",
                "evidence": [
                    {
                        "id": e.id,
                        "type": e.type,
                        "url": e.url
                    } for e in evidence
                ]
            })
        return result
    except Exception as e:
        logger.error(f"Error getting pending validations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/startups/{startup_id}/trust-dashboard")
async def get_trust_dashboard_endpoint(startup_id: int, db: Session = Depends(get_db)):
    """Get the unified Triangulation of Truth dashboard data for a startup."""
    try:
        dashboard = startup_verification.get_trust_intelligence_dashboard(startup_id, db)
        return dashboard
    except Exception as e:
        logger.error(f"Error getting trust dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/startups/by-founder/{founder_id}")
async def get_startup_by_founder_endpoint(founder_id: int, db: Session = Depends(get_db)):
    """Get startup information by founder/user ID."""
    try:
        startup = db.query(Startup).filter(Startup.founder_id == founder_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No startup found for founder {founder_id}"
            )
        
        try:
            from app.services.credibility_service import CredibilityService
            credibility_service = CredibilityService()
            credibility_service.calculate_startup_credibility(db, startup.id)
            db.refresh(startup)
        except Exception as e:
            logger.warning(f"Failed to recalculate credibility for startup {startup.id}: {e}")
        
        total_investments_result = db.query(func.sum(Investment.amount)).filter(
            Investment.startup_id == startup.id
        ).scalar()
        total_investments = float(total_investments_result) if total_investments_result else 0.0
        
        founder = db.query(User).filter(User.id == founder_id).first()
        
        return {
            "id": startup.id,
            "startup_id": startup.startup_id,
            "name": startup.name,
            "sector": startup.sector,
            "country": startup.country,
            "description": startup.description,
            "funding_goal": startup.funding_goal,
            "pitch_deck_url": startup.pitch_deck_url,
            "credibility_score": startup.credibility_score,
            "employees_verified": startup.employees_verified,
            "transaction_signature": startup.transaction_signature,
            "website": startup.website,
            "contact_email": startup.contact_email,
            "phone": startup.phone,
            "address": startup.address,
            "year_founded": startup.year_founded,
            "team_size": startup.team_size,
            "mission": startup.mission,
            "vision": startup.vision,
            "products_services": startup.products_services,
            "status": startup.status,
            "total_investments": total_investments,
            "verified": startup.transaction_signature is not None,
            "on_chain": startup.transaction_signature is not None,
            "founder": {
                "id": founder.id if founder else None,
                "name": founder.full_name if founder else None,
                "email": founder.email if founder else None
            },
            "created_at": startup.created_at.isoformat() if startup.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting startup by founder: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get startup: {str(e)}"
        )


@router.get("/api/attestations/user/{user_id}")
async def get_user_attestations(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all attestations for a user."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found"
            )
        
        # Get attestations
        attestations = db.query(Attestation).filter(
            Attestation.user_id == user_id
        ).order_by(Attestation.created_at.desc()).all()
        
        result = []
        for att in attestations:
            att_data = {
                "id": att.attestation_id,
                "issuer": att.issuer,
                "schema": att.schema,
                "status": att.status,
                "verified": att.status == "verified",
                "on_chain": att.on_chain,
                "sas_attestation_id": att.sas_attestation_id,
                "badge_type": attestation_service.get_badge_type(
                    att.issuer, 
                    att.schema, 
                    att.on_chain, 
                    att.cluster
                ),
                "created_at": att.created_at.isoformat() if att.created_at else None,
                "expires_at": att.expires_at.isoformat() if att.expires_at else None
            }
            
            # Add SAS transaction details if on-chain
            if att.on_chain and att.transaction_signature:
                cluster = att.cluster or "devnet"
                explorer_url = f"https://explorer.solana.com/tx/{att.transaction_signature}?cluster={cluster}"
                
                att_data["sas"] = {
                    "tx_signature": att.transaction_signature,
                    "cluster": cluster,
                    "explorer_url": explorer_url,
                    "account_address": att.account_address
                }
            
            result.append(att_data)
        
        return {
            "user_id": user_id,
            "wallet_address": user.wallet_address,
            "attestations": result,
            "count": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user attestations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get attestations: {str(e)}"
        )


@router.get("/api/attestations/status/{attestation_id}")
async def get_attestation_status(
    attestation_id: str,
    db: Session = Depends(get_db)
):
    """Get status of a specific attestation."""
    try:
        attestation = db.query(Attestation).filter(
            Attestation.attestation_id == attestation_id
        ).first()
        
        if not attestation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attestation {attestation_id} not found"
            )
        
        return {
            "id": attestation.attestation_id,
            "issuer": attestation.issuer,
            "schema": attestation.schema,
            "status": attestation.status,
            "verified": attestation.status == "verified",
            "on_chain": attestation.on_chain,
            "badge_type": attestation_service.get_badge_type(
                attestation.issuer, 
                attestation.schema, 
                attestation.on_chain, 
                attestation.cluster
            ),
            "created_at": attestation.created_at.isoformat() if attestation.created_at else None,
            "expires_at": attestation.expires_at.isoformat() if attestation.expires_at else None,
            "data": attestation.data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting attestation status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get attestation status: {str(e)}"
        )



class StartupRegisterRequest(BaseModel):
    name: str
    sector: str
    country: Optional[str] = None
    year_founded: Optional[int] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    description: Optional[str] = None
    products_services: Optional[str] = None
    funding_goal: Optional[float] = None
    pitch_deck_url: Optional[str] = None
    team_size: Optional[int] = 1
    founder_experience_years: Optional[int] = None
    wallet_address: Optional[str] = None


class StartupUpdateRequest(BaseModel):
    """Update startup information for credibility improvement"""
    founder_experience_years: Optional[int] = None
    has_mvp: Optional[bool] = None
    user_base_count: Optional[int] = None
    monthly_revenue: Optional[float] = None
    employees_verified: Optional[int] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    business_registration_verified: Optional[bool] = None
    documents_url: Optional[str] = None
    founder_profile_verified: Optional[bool] = None


@router.post("/api/startups/register")
async def register_startup_endpoint(
    request: StartupRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new startup."""
    try:
        logger.info(f"Registering startup: {request.name} for user {current_user.id}")
        
        founder = current_user
        
        existing_startup = db.query(Startup).filter(Startup.founder_id == founder.id).first()
        if existing_startup:
            total_investments_result = db.query(func.sum(Investment.amount)).filter(
                Investment.startup_id == existing_startup.id
            ).scalar()
            total_investments = float(total_investments_result) if total_investments_result else 0.0
            
            return {
                "id": existing_startup.id,
                "startup_id": existing_startup.startup_id,
                "name": existing_startup.name,
                "sector": existing_startup.sector,
                "transaction_signature": existing_startup.transaction_signature,
                "verified": existing_startup.transaction_signature is not None,
                "on_chain": existing_startup.transaction_signature is not None,
                "total_investments": total_investments,
                "funding_goal": existing_startup.funding_goal,
                "already_exists": True,
                "message": "You already have a registered startup"
            }
        
        import time
        blockchain_startup_id = f"STARTUP-{founder.id}-{int(time.time())}"
        transaction_signature = None

        def _trim(value: Optional[str], max_len: int) -> Optional[str]:
            if value is None:
                return None
            if not isinstance(value, str):
                value = str(value)
            return value[:max_len]

        description = _trim(request.description, 2000)
        mission = _trim(request.mission, 1000)
        vision = _trim(request.vision, 1000)
        products_services = _trim(request.products_services, 2000)
        pitch_deck_url = _trim(request.pitch_deck_url, 500)
        website = _trim(request.website, 500)
        address = _trim(request.address, 500)
        contact_email = _trim(request.contact_email, 255)
        phone = _trim(request.phone, 50)
        
        def register_on_blockchain_background(startup_db_id, startup_name, sector, founder_address):
            """Register startup on blockchain in background thread"""
            try:
                from app.db.session import SessionLocal
                db_bg = SessionLocal()
                try:
                    startup_client = StartupClient()
                    blockchain_result = startup_client.register_startup(
                        startup_name=startup_name,
                        sector=sector,
                        founder_address=founder_address
                    )
                    startup = db_bg.query(Startup).filter(Startup.id == startup_db_id).first()
                    if startup:
                        startup.transaction_signature = blockchain_result.get("transaction_signature")
                        if blockchain_result.get("startup_id"):
                            startup.startup_id = blockchain_result.get("startup_id")
                        db_bg.commit()
                        logger.info(f"✅ Background blockchain registration complete: {startup.startup_id}")
                finally:
                    db_bg.close()
            except Exception as e:
                logger.warning(f"⚠️ Background blockchain registration failed: {str(e)}")
        
        startup = Startup(
            founder_id=founder.id,
            startup_id=blockchain_startup_id,
            name=request.name,
            sector=request.sector,
            country=request.country,
            year_founded=request.year_founded,
            website=website,
            contact_email=contact_email,
            phone=phone,
            address=address,
            mission=mission,
            vision=vision,
            description=description,
            products_services=products_services,
            funding_goal=request.funding_goal,
            pitch_deck_url=pitch_deck_url,
            team_size=request.team_size,
            founder_experience_years=request.founder_experience_years,
            transaction_signature=transaction_signature,
            credibility_score=0.0,
            employees_verified=0
        )
        
        db.add(startup)
        db.commit()
        db.refresh(startup)
        
        from app.services.trust_service import CredentialService
        from app.db.models import CredentialType, CredentialSource, Credential
        from datetime import datetime
        
        credential_service = CredentialService()
        
        existing_founder_cred = (
            db.query(Credential)
            .filter(
                Credential.user_id == founder.id,
                Credential.type == CredentialType.STARTUP_ROLE,
                Credential.title == "Founder",
                Credential.organization == startup.name,
            )
            .first()
        )
        
        if not existing_founder_cred:
            try:
                start_date = None
                if startup.year_founded:
                    start_date = datetime(startup.year_founded, 1, 1)
                
                founder_credential = credential_service.create_credential(
                    db=db,
                    user_id=founder.id,
                    credential_type=CredentialType.STARTUP_ROLE,
                    title="Founder",
                    organization=startup.name,
                    start_date=start_date,
                    description=f"Founded {startup.name} in {startup.sector}",
                    source=CredentialSource.SYSTEM_GENERATED,
                )
                logger.info(f"Created founder credential {founder_credential.id} for startup {startup.name}")
            except Exception as e:
                logger.error(f"Error creating founder credential: {e}")
        
        logger.info(f"Startup registered successfully: {startup.id}, startup_id: {startup.startup_id}")
        
        try:
            import threading
            bg_thread = threading.Thread(
                target=register_on_blockchain_background,
                args=(startup.id, request.name, request.sector, request.wallet_address),
                daemon=True
            )
            bg_thread.start()
            logger.info(f"Started background blockchain registration for startup {startup.id}")
        except Exception as e:
            logger.warning(f"Failed to start background blockchain registration: {str(e)}")
        
        return {
            "id": startup.id,
            "startup_id": startup.startup_id,
            "name": startup.name,
            "sector": startup.sector,
            "transaction_signature": startup.transaction_signature,
            "verified": transaction_signature is not None,
            "on_chain": transaction_signature is not None,
            "message": "Startup registered successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error registering startup: {}", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register startup: {str(e)}"
        )


class USDCInvestmentRequest(BaseModel):
    investor_id: int
    startup_id: str
    amount_usdc: float


@router.post("/api/investments/usdc/send")
async def send_usdc_investment_endpoint(
    request: USDCInvestmentRequest,
    db: Session = Depends(get_db)
):
    """Send USDC investment to a startup."""
    try:
        result = usdc_transactions.send_usdc_investment(
            investor_id=request.investor_id,
            startup_id=request.startup_id,
            amount_usdc=request.amount_usdc,
            db=db
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error sending USDC investment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send investment: {str(e)}"
        )


class USDCInvestmentSignRequest(BaseModel):
    """Sign and broadcast a pre-built USDC transaction."""
    transactionBytes: str
    solanaAddress: str
    startupId: str
    investorId: int
    amount: float
    investmentType: str = "usdc"


@router.post("/api/investments/usdc/sign")
async def sign_usdc_investment_endpoint(
    request: USDCInvestmentSignRequest,
    db: Session = Depends(get_db)
):
    """Sign and broadcast a USDC investment transaction."""
    try:
        import base58
        from solders.transaction import VersionedTransaction
        from solders.keypair import Keypair
        from solana.rpc.async_api import AsyncClient
        from app.core.config import settings
        
        try:
            tx_bytes = base58.b58decode(request.transactionBytes)
        except Exception as e:
            raise ValueError(f"Invalid transaction bytes: {str(e)}")
        
        try:
            tx = VersionedTransaction.from_bytes(tx_bytes)
        except Exception as e:
            raise ValueError(
                f"Failed to deserialize transaction as VersionedTransaction: {str(e)}. "
                "Legacy Transaction format not yet supported. Please use VersionedTransaction."
            )
        
        signer_secret = settings.SOLANA_SIGNER_SECRET_KEY
        if not signer_secret:
            raise ValueError(
                "SOLANA_SIGNER_SECRET_KEY not configured. "
                "Set it in backend/.env with a base58 encoded private key."
            )
        
        try:
            signer_keypair = Keypair.from_base58_string(signer_secret)
        except Exception as e:
            raise ValueError(f"Invalid signer keypair: {str(e)}")
        
        try:
            legacy_tx = tx.into_legacy_transaction()
            logger.info(f"Converted VersionedTransaction to legacy Transaction for signing")
        except Exception as e:
            logger.error(f"Failed to convert to legacy transaction: {str(e)}")
            raise ValueError(f"Transaction conversion failed: {str(e)}")
        
        try:
            from solders.message import Message
            
            old_message = legacy_tx.message
            
            new_message = Message.new_with_blockhash(
                old_message.instructions,
                signer_keypair.pubkey(),
                old_message.recent_blockhash
            )
            
            from solders.transaction import Transaction as LegacyTransaction
            legacy_tx = LegacyTransaction.new_unsigned(new_message)
            
            logger.info(f"Updated transaction fee payer to backend signer: {signer_keypair.pubkey()}")
        except Exception as e:
            logger.error(f"Failed to update fee payer: {str(e)}")
            raise ValueError(f"Failed to update transaction fee payer: {str(e)}")
        
        try:
            legacy_tx.sign([signer_keypair], legacy_tx.message.recent_blockhash)
            logger.info(f"Transaction signed successfully")
        except Exception as e:
            logger.error(f"Failed to sign transaction: {str(e)}")
            raise ValueError(f"Transaction signing failed: {str(e)}")
        
        async with AsyncClient(settings.SOLANA_RPC_URL) as client:
            response = await client.send_transaction(legacy_tx)
            tx_signature = str(response.value)
        
        logger.info(f"✅ Transaction signed and broadcasted: {tx_signature}")
        
        return {
            "success": True,
            "signature": tx_signature,
            "error": None
        }
        
    except ValueError as e:
        logger.error(f"Validation error signing transaction: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error signing USDC investment transaction: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sign transaction: {str(e)}"
        )


class USDCInvestmentPrepareRequest(BaseModel):
    """Prepare a user-signed USDC transfer transaction (devnet)."""
    investor_id: int
    startup_id: str
    amount_usdc: float


@router.post("/api/investments/usdc/prepare")
async def prepare_usdc_investment_endpoint(
    request: USDCInvestmentPrepareRequest,
    db: Session = Depends(get_db)
):
    """Prepare an unsigned USDC transfer plan that the *user signs* via Privy."""
    try:
        from app.core.config import settings
        from app.db.models import Startup, User
        from app.utils.helpers import validate_solana_address
        from solana.rpc.async_api import AsyncClient

        if not settings.DEVNET_USDC_MINT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="DEVNET_USDC_MINT is not configured in backend/.env. Set DEVNET_USDC_MINT to your test USDC mint address."
            )

        investor = db.query(User).filter(User.id == request.investor_id).first()
        if not investor or not investor.wallet_address:
            raise HTTPException(status_code=400, detail="Investor must have a wallet address (login via Privy first).")

        startup = db.query(Startup).filter(Startup.startup_id == request.startup_id).first()
        if not startup:
            raise HTTPException(status_code=404, detail=f"Startup {request.startup_id} not found")

        founder = db.query(User).filter(User.id == startup.founder_id).first()
        if not founder or not founder.wallet_address:
            raise HTTPException(status_code=400, detail="Startup founder must have a wallet address.")

        investor_wallet = investor.wallet_address.strip()
        founder_wallet = founder.wallet_address.strip()

        if not validate_solana_address(investor_wallet):
            raise HTTPException(status_code=400, detail="Invalid investor Solana wallet address format")
        if not validate_solana_address(founder_wallet):
            raise HTTPException(status_code=400, detail="Invalid founder Solana wallet address format")

        if request.amount_usdc <= 0:
            raise HTTPException(status_code=400, detail="amount_usdc must be > 0")

        decimals = 6
        amount_base_units = int(round(request.amount_usdc * (10 ** decimals)))

        async with AsyncClient(settings.SOLANA_RPC_URL) as client:
            bh = await client.get_latest_blockhash()
            blockhash = str(bh.value.blockhash)
            last_valid_block_height = int(bh.value.last_valid_block_height)

        return {
            "success": True,
            "cluster": "devnet",
            "rpc_url": settings.SOLANA_RPC_URL,
            "usdc_mint": settings.DEVNET_USDC_MINT,
            "decimals": decimals,
            "amount_usdc": request.amount_usdc,
            "amount_base_units": amount_base_units,
            "investor_wallet": investor_wallet,
            "recipient_wallet": founder_wallet,
            "startup_id": request.startup_id,
            "recent_blockhash": blockhash,
            "last_valid_block_height": last_valid_block_height,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing USDC investment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to prepare investment: {str(e)}"
        )


class USDCInvestmentRecordRequest(BaseModel):
    """Record a user-signed USDC investment after it is confirmed on-chain."""
    investor_id: int
    startup_id: str
    amount_usdc: float
    tx_signature: str
    investment_id: Optional[str] = None


@router.post("/api/investments/usdc/record")
async def record_usdc_investment_endpoint(
    request: USDCInvestmentRecordRequest,
    db: Session = Depends(get_db)
):
    """Record a completed USDC investment tx signature in the database."""
    try:
        from app.core.config import settings
        from app.db.models import Investment, Startup, User
        from solana.rpc.async_api import AsyncClient

        tx_sig = (request.tx_signature or "").strip()
        if not tx_sig or tx_sig.startswith("mock_"):
            raise HTTPException(status_code=400, detail="Invalid tx_signature")

        investor = db.query(User).filter(User.id == request.investor_id).first()
        if not investor:
            raise HTTPException(status_code=404, detail=f"Investor {request.investor_id} not found")

        startup = db.query(Startup).filter(Startup.startup_id == request.startup_id).first()
        if not startup:
            raise HTTPException(status_code=404, detail=f"Startup {request.startup_id} not found")

        existing = db.query(Investment).filter(Investment.tx_signature == tx_sig).first()
        if existing:
            return {
                "success": True,
                "transaction_signature": existing.tx_signature,
                "explorer_url": f"https://explorer.solana.com/tx/{existing.tx_signature}?cluster=devnet",
                "amount_usdc": existing.amount,
                "startup_id": request.startup_id,
                "investor_id": request.investor_id,
                "investment_id": existing.investment_id,
                "timestamp": existing.timestamp.isoformat() if existing.timestamp else None,
            }

        from solders.signature import Signature
        async with AsyncClient(settings.SOLANA_RPC_URL) as client:
            sig_obj = Signature.from_string(tx_sig)
            statuses = await client.get_signature_statuses([sig_obj])
            tx_status = statuses.value[0] if statuses and statuses.value else None
            if not tx_status:
                raise HTTPException(status_code=400, detail="Transaction not found on devnet yet. Try again in a few seconds.")
            if tx_status.err is not None:
                raise HTTPException(status_code=400, detail=f"Transaction failed: {tx_status.err}")

        investment = Investment(
            startup_id=startup.id,
            investor_id=request.investor_id,
            amount=request.amount_usdc,
            tx_signature=tx_sig,
            investment_id=request.investment_id,
        )
        db.add(investment)
        db.commit()
        db.refresh(investment)

        try:
            from app.services.credibility_service import CredibilityService
            CredibilityService().calculate_startup_credibility(db, startup.id)
        except Exception as e:
            logger.warning(f"Credibility recalculation failed after investment record: {e}")

        return {
            "success": True,
            "transaction_signature": investment.tx_signature,
            "explorer_url": f"https://explorer.solana.com/tx/{investment.tx_signature}?cluster=devnet",
            "amount_usdc": investment.amount,
            "startup_id": request.startup_id,
            "investor_id": request.investor_id,
            "investment_id": investment.investment_id,
            "timestamp": investment.timestamp.isoformat() if investment.timestamp else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording USDC investment: {str(e)}")
        from fastapi import status as http_status
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record investment: {str(e)}"
        )


@router.get("/api/investments/portfolio/{investor_id}")
async def get_portfolio_endpoint(investor_id: int, db: Session = Depends(get_db)):
    """Get investor portfolio with all investments."""
    try:
        portfolio = investor_portfolio.get_portfolio(investor_id, db)
        return portfolio
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting portfolio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get portfolio: {str(e)}"
        )


@router.get("/api/investments/startup/{startup_id}")
async def get_startup_investments_endpoint(startup_id: str, db: Session = Depends(get_db)):
    """Get all investments for a specific startup."""
    try:
        investments = investor_portfolio.get_startup_investments(startup_id, db)
        return {"investments": investments, "count": len(investments)}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting startup investments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get startup investments: {str(e)}"
        )


@router.get("/api/investments/{investment_id}/receipt")
async def download_investment_receipt_endpoint(
    investment_id: int,
    db: Session = Depends(get_db)
):
    """Download PDF receipt for an investment transaction."""
    try:
        investment = db.query(Investment).filter(Investment.id == investment_id).first()
        if not investment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investment {investment_id} not found"
            )
        
        investor = db.query(User).filter(User.id == investment.investor_id).first()
        if not investor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investor {investment.investor_id} not found"
            )
        
        startup = db.query(Startup).filter(Startup.id == investment.startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {investment.startup_id} not found"
            )
        
        investment_data = {
            "id": investment.id,
            "amount": investment.amount,
            "tx_signature": investment.tx_signature,
            "timestamp": investment.timestamp.isoformat() if investment.timestamp else None,
            "explorer_url": f"https://explorer.solana.com/tx/{investment.tx_signature}?cluster=devnet" if investment.tx_signature and not investment.tx_signature.startswith("mock_") else None
        }
        
        investor_data = {
            "full_name": investor.full_name,
            "email": investor.email,
            "wallet_address": investor.wallet_address
        }
        
        startup_data = {
            "name": startup.name,
            "startup_id": startup.startup_id,
            "sector": startup.sector
        }
        
        pdf_bytes = receipt_generator.generate_receipt(
            investment_data,
            investor_data,
            startup_data
        )
        
        filename = f"Investment-Receipt-{investment.id}-{startup.startup_id}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating receipt: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate receipt: {str(e)}"
        )


@router.patch("/api/startups/{startup_id}/update-credibility")
async def update_startup_credibility_fields(
    startup_id: str,
    update_data: StartupUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update startup credibility-related fields."""
    try:
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {startup_id} not found"
            )
        
        if update_data.founder_experience_years is not None:
            startup.founder_experience_years = update_data.founder_experience_years
        if update_data.has_mvp is not None:
            startup.has_mvp = update_data.has_mvp
        if update_data.user_base_count is not None:
            startup.user_base_count = update_data.user_base_count
        if update_data.monthly_revenue is not None:
            startup.monthly_revenue = update_data.monthly_revenue
        if update_data.employees_verified is not None:
            startup.employees_verified = update_data.employees_verified
        if update_data.website is not None:
            startup.website = update_data.website
        if update_data.contact_email is not None:
            startup.contact_email = update_data.contact_email
        if update_data.address is not None:
            startup.address = update_data.address
        if update_data.business_registration_verified is not None:
            startup.business_registration_verified = update_data.business_registration_verified
        if update_data.documents_url is not None:
            startup.documents_url = update_data.documents_url
        if update_data.founder_profile_verified is not None:
            startup.founder_profile_verified = update_data.founder_profile_verified
        
        credibility_service = CredibilityService()
        credibility_service.calculate_startup_credibility(db, startup.id)
        db.refresh(startup)
        
        db.commit()
        
        logger.info(f"Updated credibility fields for startup {startup_id}")
        return {
            "success": True,
            "startup_id": startup.startup_id,
            "credibility_score": startup.credibility_score,
            "message": "Credibility fields updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating startup credibility: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update startup credibility: {str(e)}"
        )


class AddEmployeeRequest(BaseModel):
    name: str
    email: str
    role: str
    wallet_address: Optional[str] = None
    certificate_id: Optional[str] = None


@router.post("/api/startups/{startup_id}/add-employee")
async def add_employee_to_startup(
    startup_id: str,
    employee_data: AddEmployeeRequest,
    db: Session = Depends(get_db)
):
    """Add a team member to a startup with optional blockchain verification."""
    try:
        startup = db.query(Startup).filter(Startup.startup_id == startup_id).first()
        if not startup:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Startup {startup_id} not found"
            )
        
        employee = Employee(
            startup_id=startup.id,
            name=employee_data.name,
            email=employee_data.email,
            role=employee_data.role,
            wallet_address=employee_data.wallet_address,
            certificate_id=employee_data.certificate_id,
            verified_on_chain=False
        )
        
        if employee_data.wallet_address and employee_data.certificate_id:
            try:
                startup_client = StartupClient()
                blockchain_result = startup_client.add_employee(
                    startup_id=startup_id,
                    certificate_id=employee_data.certificate_id,
                    employee_address=employee_data.wallet_address
                )
                employee.verified_on_chain = True
                employee.transaction_signature = blockchain_result.get("transaction_signature")
                logger.info(f"Employee {employee_data.name} verified on blockchain")
            except Exception as e:
                logger.warning(f"Blockchain verification failed for employee {employee_data.name}: {str(e)}")
        
        db.add(employee)
        
        verified_count = db.query(Employee).filter(
            Employee.startup_id == startup.id,
            Employee.verified_on_chain == True
        ).count()
        startup.employees_verified = verified_count
        
        credibility_service = CredibilityService()
        credibility_service.calculate_startup_credibility(db, startup.id)
        db.refresh(startup)
        
        db.commit()
        
        logger.info(f"Employee {employee_data.name} added to startup {startup_id}")
        return {
            "success": True,
            "employee_id": employee.id,
            "verified_on_chain": employee.verified_on_chain,
            "transaction_signature": employee.transaction_signature,
            "employees_verified": startup.employees_verified,
            "credibility_score": startup.credibility_score,
            "message": "Employee added successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add employee: {str(e)}"
        )


# ==================== ATTESTATION ENDPOINTS ====================

class BusinessVerificationRequest(BaseModel):
    wallet_address: str
    business_name: str
    registration_number: str
    issuer: str = "verify"
    create_sas_attestation: bool = True
    additional_data: Optional[Dict[str, Any]] = None


class IdentityVerificationRequest(BaseModel):
    wallet_address: str
    full_name: str
    email: str
    date_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    issuer: str = "civic"
    create_sas_attestation: bool = True
    additional_data: Optional[Dict[str, Any]] = None


@router.post("/api/attestations/verify/business")
async def verify_business_ownership(
    request: BusinessVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify business ownership via Verify or Civic."""
    try:
        user = db.query(User).filter(User.wallet_address == request.wallet_address).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with wallet address {request.wallet_address} not found"
            )
        
        business_data = {
            "business_name": request.business_name,
            "registration_number": request.registration_number,
            **(request.additional_data or {})
        }
        
        result = await attestation_service.verify_business_ownership(
            wallet_address=request.wallet_address,
            business_data=business_data,
            issuer=request.issuer,
            create_sas_attestation=request.create_sas_attestation
        )
        
        if result.verified:
            tx_signature = result.data.get("transaction_signature") if result.on_chain else None
            cluster = result.data.get("cluster", "devnet") if result.on_chain else None
            account_address = result.data.get("account_address") if result.on_chain else None
            
            attestation = Attestation(
                user_id=user.id,
                wallet_address=request.wallet_address,
                attestation_id=result.attestation_id,
                issuer=result.issuer,
                schema=result.schema,
                status=result.status.value,
                data=result.data,
                on_chain=result.on_chain,
                sas_attestation_id=result.data.get("sas_attestation_id") if result.on_chain else None,
                transaction_signature=tx_signature,
                cluster=cluster,
                account_address=account_address,
                verified_at=result.timestamp if result.verified else None,
                expires_at=result.expires_at
            )
            db.add(attestation)
            db.commit()
            db.refresh(attestation)
            
            if result.verified and user.role in ["founder", "startup"]:
                try:
                    startup = db.query(Startup).filter(Startup.founder_id == user.id).first()
                    if startup:
                        from app.services.credibility_service import CredibilityService
                        credibility_service = CredibilityService()
                        credibility_service.calculate_startup_credibility(db, startup.id)
                        db.commit()
                        logger.info(f"Recalculated credibility for startup {startup.id} after business attestation")
                except Exception as e:
                    logger.warning(f"Failed to recalculate credibility after business attestation: {e}")
        
        response_data = {
            "success": result.verified,
            "attestation": {
                "id": result.attestation_id,
                "issuer": result.issuer,
                "status": result.status.value,
                "verified": result.verified,
                "on_chain": result.on_chain,
                "badge_type": attestation_service.get_badge_type(result.issuer, result.schema),
                "expires_at": result.expires_at.isoformat() if result.expires_at else None
            },
            "error": result.error
        }
        
        if result.on_chain and result.data.get("transaction_signature"):
            response_data["sas"] = {
                "tx_signature": result.data.get("transaction_signature"),
                "cluster": result.data.get("cluster", "devnet"),
                "explorer_url": result.data.get("explorer_url"),
                "account_address": result.data.get("account_address")
            }
        
        return response_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error verifying business ownership: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify business: {str(e)}"
        )


@router.post("/api/attestations/verify/identity")
async def verify_identity(
    request: IdentityVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify identity/KYC via Civic or Verify."""
    try:
        user = db.query(User).filter(User.wallet_address == request.wallet_address).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with wallet address {request.wallet_address} not found"
            )
        
        identity_data = {
            "full_name": request.full_name,
            "email": request.email,
            "date_of_birth": request.date_of_birth,
            "nationality": request.nationality,
            **(request.additional_data or {})
        }
        
        result = await attestation_service.verify_identity(
            wallet_address=request.wallet_address,
            identity_data=identity_data,
            issuer=request.issuer,
            create_sas_attestation=request.create_sas_attestation
        )
        
        if result.verified:
            tx_signature = result.data.get("transaction_signature") if result.on_chain else None
            cluster = result.data.get("cluster", "devnet") if result.on_chain else None
            account_address = result.data.get("account_address") if result.on_chain else None
            
            attestation = Attestation(
                user_id=user.id,
                wallet_address=request.wallet_address,
                attestation_id=result.attestation_id,
                issuer=result.issuer,
                schema=result.schema,
                status=result.status.value,
                data=result.data,
                on_chain=result.on_chain,
                sas_attestation_id=result.data.get("sas_attestation_id") if result.on_chain else None,
                transaction_signature=tx_signature,
                cluster=cluster,
                account_address=account_address,
                verified_at=result.timestamp if result.verified else None,
                expires_at=result.expires_at
            )
            db.add(attestation)
            db.commit()
            db.refresh(attestation)
            
            if result.verified and user.role in ["founder", "startup"]:
                try:
                    startup = db.query(Startup).filter(Startup.founder_id == user.id).first()
                    if startup:
                        from app.services.credibility_service import CredibilityService
                        credibility_service = CredibilityService()
                        credibility_service.calculate_startup_credibility(db, startup.id)
                        db.commit()
                        logger.info(f"Recalculated credibility for startup {startup.id} after identity attestation")
                except Exception as e:
                    logger.warning(f"Failed to recalculate credibility after identity attestation: {e}")
        
        response_data = {
            "success": result.verified,
            "attestation": {
                "id": result.attestation_id,
                "issuer": result.issuer,
                "status": result.status.value,
                "verified": result.verified,
                "on_chain": result.on_chain,
                "badge_type": attestation_service.get_badge_type(
                    result.issuer, 
                    result.schema, 
                    result.on_chain, 
                    result.data.get("cluster") if result.on_chain else None
                ),
                "expires_at": result.expires_at.isoformat() if result.expires_at else None
            },
            "error": result.error
        }
        
        if result.on_chain and result.data.get("transaction_signature"):
            response_data["sas"] = {
                "tx_signature": result.data.get("transaction_signature"),
                "cluster": result.data.get("cluster", "devnet"),
                "explorer_url": result.data.get("explorer_url"),
                "account_address": result.data.get("account_address")
            }
        
        return response_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error verifying identity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify identity: {str(e)}"
        )


@router.get("/api/attestations/wallet/{wallet_address}")
async def get_attestations(
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """Get all attestations for a wallet address."""
    try:
        attestations = db.query(Attestation).filter(
            Attestation.wallet_address == wallet_address
        ).order_by(Attestation.created_at.desc()).all()
        
        all_attestations = await attestation_service.get_all_attestations(wallet_address)
        
        result = []
        for att in attestations:
            att_data = {
                "id": att.attestation_id,
                "issuer": att.issuer,
                "schema": att.schema,
                "status": att.status,
                "verified": att.status == "verified",
                "on_chain": att.on_chain,
                "sas_attestation_id": att.sas_attestation_id,
                "badge_type": attestation_service.get_badge_type(att.issuer, att.schema, att.on_chain, att.cluster),
                "verified_at": att.verified_at.isoformat() if att.verified_at else None,
                "expires_at": att.expires_at.isoformat() if att.expires_at else None,
            }
            result.append(att_data)
        
        return {"attestations": result, "on_chain_attestations": all_attestations}
    except Exception as e:
        logger.error(f"Error getting attestations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get attestations: {str(e)}"
        )
