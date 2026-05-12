"""
User capabilities for unified accounts.

Determines which roles a user can act as:
- job_seeker: always true (anyone can build CV / look for jobs)
- founder: true if user has at least one registered startup
- investor: always true (anyone can invest)
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import User, Startup, GroundAgentApplication, ApplicationStatus


# Role values used in API and frontend (match UserRole values)
GROUND_AGENT_ROLE = "enumerator"
FOUNDER_ROLE = "founder"
INVESTOR_ROLE = "investor"


def get_user_capabilities(db: Session, user: User) -> Dict[str, Any]:
    """
    Compute which roles this user can act as (unified account capabilities).
    """
    has_startup = (
        db.query(Startup.id).filter(Startup.founder_id == user.id).limit(1).first()
        is not None
    )
    
    # Check if user is an approved ground agent
    is_ground_agent = (
        db.query(GroundAgentApplication.id)
        .filter(
            GroundAgentApplication.user_id == user.id,
            GroundAgentApplication.status == ApplicationStatus.APPROVED
        )
        .limit(1)
        .first()
        is not None
    )

    primary = user.role.value if hasattr(user.role, "value") else str(user.role)
    is_admin = primary in ["admin", "superadmin"] or user.email.lower() == "josephemsamah@gmail.com"
    
    # Anyone can be an investor, but admins can be EVERYTHING
    if is_admin:
        allowed = [INVESTOR_ROLE, FOUNDER_ROLE, GROUND_AGENT_ROLE, "admin"]
    else:
        allowed = [INVESTOR_ROLE]
    
    # Can be a founder if has a startup
    if has_startup:
        allowed.append(FOUNDER_ROLE)
    
    # Can be a ground agent if approved or if it's their primary role
    if is_ground_agent or primary == GROUND_AGENT_ROLE:
        allowed.append(GROUND_AGENT_ROLE)
        
    # Dedupe and keep order
    allowed = list(dict.fromkeys(allowed))
    return {
        "ground_agent": is_ground_agent or primary == GROUND_AGENT_ROLE or is_admin,
        "founder": has_startup or is_admin,
        "investor": True,
        "admin": is_admin,
        "allowed_roles": allowed,
        "primary_role": primary,
    }


def user_has_capability(db: Session, user: User, role: str) -> bool:
    """Check if user can act as the given role."""
    caps = get_user_capabilities(db, user)
    return role in caps.get("allowed_roles", [])
