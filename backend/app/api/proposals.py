from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.db.models import User, Startup, UserRole
from app.db.models.proposal import Proposal, ProposalStatus
from app.db.models.milestone import Milestone, MilestoneStatus
from app.db.models.ground_agent_report import GroundAgentReport, ReportStatus
from app.core.dependencies import get_current_user
from app.utils.logger import logger

router = APIRouter(prefix="/api/proposals", tags=["proposals"])

# Pydantic schemas
class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float

class ProposalCreate(BaseModel):
    startup_id: int
    funding_goal: float
    milestones: List[MilestoneCreate]

class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    amount: float
    status: MilestoneStatus

    class Config:
        from_attributes = True

class ProposalResponse(BaseModel):
    id: int
    startup_id: int
    version_number: int
    funding_goal: float
    status: ProposalStatus
    created_at: datetime
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    evidence_url: Optional[str]
    notes: Optional[str]

# Routes

@router.post("/", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Startups create an investment proposal with a list of milestones."""
    if current_user.role != UserRole.STARTUP:
        raise HTTPException(status_code=403, detail="Only startups can create proposals")

    startup = db.query(Startup).filter(Startup.id == data.startup_id, Startup.founder_id == current_user.id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found or unauthorized")

    # Increment version based on existing proposals
    existing_count = db.query(Proposal).filter(Proposal.startup_id == startup.id).count()

    proposal = Proposal(
        startup_id=startup.id,
        version_number=existing_count + 1,
        funding_goal=data.funding_goal,
        status=ProposalStatus.DRAFT
    )
    db.add(proposal)
    db.flush()

    for m in data.milestones:
        db.add(Milestone(
            proposal_version_id=proposal.id,
            title=m.title,
            description=m.description,
            amount=m.amount,
            status=MilestoneStatus.PENDING
        ))
    
    db.commit()
    db.refresh(proposal)
    return proposal


@router.get("/", response_model=List[ProposalResponse])
def list_proposals(
    db: Session = Depends(get_db)
):
    """Investors and admins can see all proposals that are not in DRAFT status."""
    return db.query(Proposal).filter(Proposal.status != ProposalStatus.DRAFT).all()

@router.get("/my-proposals", response_model=List[ProposalResponse])
def get_my_proposals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch the startup's own proposals."""
    if current_user.role != UserRole.STARTUP:
        raise HTTPException(status_code=403, detail="Not a startup")
    
    startup = db.query(Startup).filter(Startup.founder_id == current_user.id).first()
    if not startup:
        return []
    
    return db.query(Proposal).filter(Proposal.startup_id == startup.id).all()


@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch a proposal by ID with its milestones."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


@router.put("/{proposal_id}/submit")
def submit_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Startup submits draft proposal for admin/investor review."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Not found")
    
    startup = db.query(Startup).filter(Startup.id == proposal.startup_id, Startup.founder_id == current_user.id).first()
    if not startup:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if proposal.status != ProposalStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT proposals can be submitted")
    
    proposal.status = ProposalStatus.PENDING_ADMIN
    db.commit()
    return {"message": "Proposal submitted successfully", "status": proposal.status}

@router.put("/{proposal_id}/approve")
def approve_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Investors/Admins approve the proposal, triggering state transition to LOCKED."""
    if current_user.role not in [UserRole.INVESTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only investors or admins can approve proposals")

    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Not found")
    
    if proposal.status != ProposalStatus.PENDING_ADMIN:
        raise HTTPException(status_code=400, detail="Proposal not in pending state")
    
    proposal.status = ProposalStatus.LOCKED
    db.commit()
    return {"message": "Proposal approved and locked", "status": proposal.status}


@router.post("/milestones/{milestone_id}/reports")
def submit_report(
    milestone_id: int,
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ground Agents submit evidence to GroundAgentReport."""
    if current_user.role != UserRole.GROUND_AGENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only agents can submit reports")
    
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    report = GroundAgentReport(
        milestone_id=milestone_id,
        agent_id=current_user.id,
        evidence_url=data.evidence_url,
        notes=data.notes,
        status=ReportStatus.SUBMITTED
    )
    db.add(report)

    # Change milestone status to agent_verified
    milestone.status = MilestoneStatus.AGENT_VERIFIED
    
    db.commit()
    return {"message": "Report submitted", "milestone_status": milestone.status}


@router.put("/milestones/{milestone_id}/verify-admin")
def verify_admin(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin verifies the milestone after agent."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can verify")
    
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    milestone.status = MilestoneStatus.ADMIN_VERIFIED
    db.commit()
    return {"message": "Admin verified", "milestone_status": milestone.status}
