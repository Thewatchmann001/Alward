#!/usr/bin/env python3
"""Seed a minimal ALWARD demo database with sample users and startups."""
import sys
from pathlib import Path

# Allow imports from backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.db.models.user import UserRole


def create_schema():
    Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        print("🌱 Creating demo schema and sample data...")
        create_schema()

        # Insert users using raw SQL to avoid mapper issues
        users_data = [
            {
                "full_name": "Frank Investor",
                "email": "frank@investor.com",
                "password": get_password_hash("hackathon123"),
                "role": UserRole.INVESTOR.value,
                "wallet_address": "FwJVofSALMXyNZXwGoCkVvPkUk435gCtfCgR8Gj9LG2b",
                "is_diaspora": 1,
                "origin_country": "Sierra Leone",
                "residence_country": "USA",
            },
            {
                "full_name": "Kadiatu Fofanah",
                "email": "kadiatu@investor.com",
                "password": get_password_hash("hackathon123"),
                "role": UserRole.INVESTOR.value,
                "wallet_address": "9xKpLmNqR2sTvW4yZ6aB8cD1eF3gH5jK7mN9pQ2r",
                "is_diaspora": 1,
                "origin_country": "Sierra Leone",
                "residence_country": "Canada",
            },
            {
                "full_name": "David Founder",
                "email": "david@startup.com",
                "password": get_password_hash("hackathon123"),
                "role": UserRole.STARTUP.value,
                "wallet_address": "BhLh32RvnYxF3qesVxkjgKjPpg9gUF24oFUPDM3VkwW6",
                "is_diaspora": 0,
                "origin_country": "Sierra Leone",
                "residence_country": "Sierra Leone",
                "company_name": "TechInnovate SL",
            },
            {
                "full_name": "Hawa Mansaray",
                "email": "hawa@startup.com",
                "password": get_password_hash("hackathon123"),
                "role": UserRole.STARTUP.value,
                "wallet_address": "AcYnQ3GHDHF5e8NojkCZVGo294RpJNSqqSgNkWnCQDzH",
                "is_diaspora": 0,
                "origin_country": "Sierra Leone",
                "residence_country": "Sierra Leone",
                "company_name": "HealthConnect Sierra Leone",
            },
        ]

        for user_data in users_data:
            # Check if user exists
            existing = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user_data["email"]}).scalar()
            if not existing:
                db.execute(text("""
                    INSERT INTO users
                    (full_name, email, hashed_password, role, wallet_address, company_name, is_diaspora, origin_country, residence_country, auth_provider)
                    VALUES (:full_name, :email, :password, :role, :wallet_address, :company_name, :is_diaspora, :origin_country, :residence_country, :auth_provider)
                """), {
                    "full_name": user_data["full_name"],
                    "email": user_data["email"],
                    "password": user_data["password"],
                    "role": user_data["role"],
                    "wallet_address": user_data["wallet_address"],
                    "company_name": user_data.get("company_name"),
                    "is_diaspora": user_data["is_diaspora"],
                    "origin_country": user_data["origin_country"],
                    "residence_country": user_data["residence_country"],
                    "auth_provider": "local",
                })

        # Get user IDs
        frank_id = db.execute(text("SELECT id FROM users WHERE email = 'frank@investor.com'")).scalar()
        kadiatu_id = db.execute(text("SELECT id FROM users WHERE email = 'kadiatu@investor.com'")).scalar()
        david_id = db.execute(text("SELECT id FROM users WHERE email = 'david@startup.com'")).scalar()
        hawa_id = db.execute(text("SELECT id FROM users WHERE email = 'hawa@startup.com'")).scalar()

        # Insert startups using raw SQL
        startups_data = [
            {
                "founder_id": david_id,
                "startup_id": "ALWARD-STARTUP-001",
                "name": "TechInnovate SL",
                "sector": "Technology",
                "country": "Sierra Leone",
                "description": "A local software development studio that digitizes SMEs in West Africa.",
                "credibility_score": 85.0,
                "transaction_signature": "mock_tx_001",
                "risk_score": 35.0,
                "verification_summary": '{"founder_claims": 0.4, "ground_agent_verification": 0.35, "community_audit": 0.25}',
                "website": "https://techinnovate-sl.com",
                "funding_goal": 250000.0,
            },
            {
                "founder_id": hawa_id,
                "startup_id": "ALWARD-STARTUP-002",
                "name": "HealthConnect Sierra Leone",
                "sector": "Healthcare",
                "country": "Sierra Leone",
                "description": "Telemedicine and health records platform for rural clinics.",
                "credibility_score": 78.0,
                "transaction_signature": "mock_tx_002",
                "risk_score": 42.0,
                "verification_summary": '{"founder_claims": 0.45, "ground_agent_verification": 0.3, "community_audit": 0.25}',
                "website": "https://healthconnect-sl.com",
                "funding_goal": 350000.0,
            },
        ]

        for startup_data in startups_data:
            # Check if startup exists
            existing = db.execute(text("SELECT id FROM startups WHERE startup_id = :startup_id"), {"startup_id": startup_data["startup_id"]}).scalar()
            if not existing:
                db.execute(text("""
                    INSERT INTO startups
                    (founder_id, startup_id, name, sector, country, description, credibility_score, transaction_signature, risk_score, verification_summary, website, funding_goal)
                    VALUES (:founder_id, :startup_id, :name, :sector, :country, :description, :credibility_score, :transaction_signature, :risk_score, :verification_summary, :website, :funding_goal)
                """), startup_data)

        db.commit()

        print("✅ Seeded demo data successfully.")
    except Exception as e:
        db.rollback()
        print("❌ Seed failed:", str(e))
    finally:
        db.close()


if __name__ == "__main__":
    seed()