from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://alward:alward@localhost:5432/alwarddb"  # Override in .env for production
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"  # MUST be changed in .env for production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # Extended for intelligence access
    
    # Solana
    SOLANA_RPC_URL: str = "https://api.devnet.solana.com"
    WALLET_PATH: str = "~/.config/solana/id.json"
    SOLANA_SIGNER_SECRET_KEY: Optional[str] = None  # Base58-encoded secret key for signing transactions
    
    # Devnet USDC Mint (test token - no real value)
    DEVNET_USDC_MINT: Optional[str] = None  # Set to your test mint address
    
    # Program IDs
    CERTIFICATE_PROGRAM_ID: str = "D7SYneSxju3iTtJW9HPQMVjQRXgTCZi2vR2UWRk8nTRa"
    STARTUP_PROGRAM_ID: str = "DqwhC5DDZZmL4E1f4YYQJ9R121NurZV8ttk2dfGoYnTj"
    INVESTMENT_PROGRAM_ID: str = "FEQJZDk4afcXbSrRj7iW3PieNtrmeT2Hjtt5BCmoNfRr"
    
    # Blockchain Scripts Path
    BLOCKCHAIN_SCRIPTS_PATH: str = "../blockchain/scripts"
    
    # AI Service
    MISTRAL_API_KEY: Optional[str] = None  # Set in .env file - NEVER commit real keys!
    
    # Privy Authentication
    APP_ID: Optional[str] = None
    PRIVY_ID: Optional[str] = None
    CLIENT_ID: Optional[str] = None
    
    # App
    APP_NAME: str = "ALWARD Intelligence API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    FRONTEND_URL: str = "http://localhost:3000"
    
    # CORS: comma-separated extra origins for production
    CORS_ORIGINS: Optional[str] = None
    
    # Stripe (card payments: investor -> startup)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    
    # File Uploads
    UPLOAD_DIR: str = "static/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB for reports
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"]
    
    # OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/oauth/google/callback"
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Security Settings
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 30

    @property
    def privy_app_id(self) -> Optional[str]:
        return self.PRIVY_ID or self.APP_ID
    
    # Attestation Service Settings (Triangulation of Truth)
    ATTESTATION_MODE: str = "production"
    VERIFY_API_KEY: Optional[str] = None
    VERIFY_API_URL: Optional[str] = None
    CIVIC_API_KEY: Optional[str] = None
    CIVIC_API_URL: Optional[str] = None
    SAS_API_KEY: Optional[str] = None
    SAS_API_URL: Optional[str] = "https://attest.solana.com"
    
    # Solana Attestation Flags
    USE_REAL_SOLANA: bool = True
    USE_REAL_VERIFIERS: bool = True
    SOLANA_CLUSTER: str = "devnet"
    # SOLANA_RPC_URL already defined above
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

