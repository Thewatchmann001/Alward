from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class UserRole(str, enum.Enum):
    GROUND_AGENT = "enumerator"  # Map legacy enumerator to Ground Agent
    STARTUP = "founder"
    INVESTOR = "investor"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"
    USER = "user"
    VENDOR = "vendor"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False)
    wallet_address = Column(String(44), unique=True, index=True, nullable=True)
    
    # Diaspora Intelligence Fields
    is_diaspora = Column(Integer, default=0) # 1 for yes, 0 for no
    origin_country = Column(String(100), nullable=True)
    residence_country = Column(String(100), nullable=True)
    
    company_name = Column(String(255), nullable=True)
    university = Column(String(255), nullable=True)
    verified_on_chain = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # OAuth fields
    auth_provider = Column(String(20), default="local", nullable=False)
    provider_id = Column(String(255), nullable=True, index=True)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    # Relationships
    startups = relationship("Startup", back_populates="founder")
    investments = relationship("Investment", back_populates="investor")
    credentials = relationship("Credential", back_populates="user", cascade="all, delete-orphan")
    trust_signals = relationship("TrustSignal", back_populates="user", cascade="all, delete-orphan")
    attestations = relationship("Attestation", back_populates="user", cascade="all, delete-orphan")
    ground_agent_applications = relationship("GroundAgentApplication", back_populates="user", cascade="all, delete-orphan")

