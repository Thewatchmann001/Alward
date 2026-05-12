"""
seed_demo_startups.py
Run this script to populate the database with demo startups for the ALWARD hackathon demo.
Usage: python seed_demo_startups.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal
from app.db.models.startup import Startup
from app.db.models.user import User, UserRole
from sqlalchemy import text

DEMO_STARTUPS = [
    {
        "name": "AgriLink SL",
        "sector": "Agriculture",
        "country": "Sierra Leone",
        "description": "Connecting smallholder farmers to markets using mobile-first supply chain technology. Real-time price discovery for cocoa, cassava, and rice.",
        "mission": "Empower 50,000 Sierra Leonean farmers with direct market access by 2027.",
        "vision": "A food-secure West Africa where no farmer sells below cost.",
        "products_services": "Mobile market platform, logistics aggregation, produce grading API.",
        "funding_goal": 75000,
        "team_size": 8,
        "founder_experience_years": 6,
        "website": "https://agrilink.sl",
        "contact_email": "hello@agrilink.sl",
        "phone": "+232 76 111 222",
        "address": "34 Wellington Street, Freetown, Sierra Leone",
        "status": "approved",
        "credibility_score": 78.0,
        "risk_score": 28.0,
        "year_founded": 2023,
        "pitch_deck_url": "https://agrilink.sl/deck.pdf",
    },
    {
        "name": "MedReach Africa",
        "sector": "Healthcare",
        "country": "Sierra Leone",
        "description": "Telemedicine and diagnostics platform serving rural communities with AI-assisted triage and community health worker networks.",
        "mission": "Bring specialist-level care to every community in Sierra Leone.",
        "vision": "Zero preventable deaths from diagnostic delays in Sub-Saharan Africa.",
        "products_services": "Telemedicine app, CHW training platform, diagnostic test-kit distribution.",
        "funding_goal": 120000,
        "team_size": 14,
        "founder_experience_years": 9,
        "website": "https://medreach.africa",
        "contact_email": "ops@medreach.africa",
        "phone": "+232 78 333 444",
        "address": "12 Sani Abacha Street, Freetown",
        "status": "approved",
        "credibility_score": 85.0,
        "risk_score": 18.0,
        "year_founded": 2022,
        "pitch_deck_url": "",
    },
    {
        "name": "EduPath Technologies",
        "sector": "Education",
        "country": "Sierra Leone",
        "description": "Offline-first learning management system for secondary schools. Works without internet — syncs when connected.",
        "mission": "Ensure every student in Sierra Leone has access to quality digital education regardless of connectivity.",
        "vision": "Africa's largest offline education network by 2030.",
        "products_services": "Offline LMS tablet software, teacher dashboards, government curriculum integration.",
        "funding_goal": 50000,
        "team_size": 5,
        "founder_experience_years": 4,
        "website": "",
        "contact_email": "team@edupath.sl",
        "phone": "+232 77 555 666",
        "address": "Bo Town, Sierra Leone",
        "status": "approved",
        "credibility_score": 65.0,
        "risk_score": 42.0,
        "year_founded": 2024,
        "pitch_deck_url": "",
    },
    {
        "name": "SolarGrid SL",
        "sector": "Technology",
        "country": "Sierra Leone",
        "description": "Pay-as-you-go solar micro-grid installations for off-grid communities. Mobile money payments integrated from day one.",
        "mission": "Power 100 communities with clean, affordable electricity by 2026.",
        "vision": "End energy poverty across Sierra Leone through distributed renewables.",
        "products_services": "Solar micro-grid hardware, IoT monitoring, pay-go mobile billing.",
        "funding_goal": 200000,
        "team_size": 22,
        "founder_experience_years": 11,
        "website": "https://solargrid.sl",
        "contact_email": "invest@solargrid.sl",
        "phone": "+232 79 777 888",
        "address": "Kenema, Sierra Leone",
        "status": "approved",
        "credibility_score": 91.0,
        "risk_score": 12.0,
        "year_founded": 2021,
        "pitch_deck_url": "https://solargrid.sl/investor-deck.pdf",
    },
    {
        "name": "FinFlow Freetown",
        "sector": "Finance",
        "country": "Sierra Leone",
        "description": "Micro-lending and savings platform for informal traders using AI credit scoring from mobile money transaction history.",
        "mission": "Provide affordable credit to 10,000 informal traders who are invisible to traditional banks.",
        "vision": "Financial inclusion as a right, not a privilege.",
        "products_services": "AI credit scoring, micro-loan disbursement, group savings circles app.",
        "funding_goal": 90000,
        "team_size": 11,
        "founder_experience_years": 7,
        "website": "https://finflow.sl",
        "contact_email": "contact@finflow.sl",
        "phone": "+232 76 999 000",
        "address": "Congo Cross, Freetown",
        "status": "pending",
        "credibility_score": 52.0,
        "risk_score": 55.0,
        "year_founded": 2024,
        "pitch_deck_url": "",
    },
    {
        "name": "TourPath SL",
        "sector": "Tourism",
        "country": "Sierra Leone",
        "description": "Digital tourism marketplace connecting diaspora travellers to verified local guides, eco-lodges, and cultural experiences.",
        "mission": "Make Sierra Leone's natural beauty accessible to the global diaspora.",
        "vision": "Triple tourism revenue for Sierra Leone through authentic digital storytelling.",
        "products_services": "Tour booking platform, guide verification, experience curation, diaspora travel packages.",
        "funding_goal": 40000,
        "team_size": 4,
        "founder_experience_years": 3,
        "website": "",
        "contact_email": "hello@tourpath.sl",
        "phone": "+232 77 123 456",
        "address": "Aberdeen, Freetown",
        "status": "pending",
        "credibility_score": 38.0,
        "risk_score": 68.0,
        "year_founded": 2025,
        "pitch_deck_url": "",
    },
]


def get_or_create_demo_user(db):
    """Get or create a demo admin user to own the seeded startups."""
    demo_email = "demo-seed@alward.io"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email=demo_email,
            full_name="ALWARD Demo",
            hashed_password=get_password_hash("demo-password-123"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(user)
        db.flush()
        print(f"  Created demo seed user: {demo_email}")
    else:
        print(f"  Using existing demo user: {demo_email} (id={user.id})")
    return user


def seed():
    db = SessionLocal()
    try:
        print("🌱 Seeding demo startups...")
        demo_user = get_or_create_demo_user(db)

        seeded = 0
        skipped = 0
        for s in DEMO_STARTUPS:
            existing = db.query(Startup).filter(Startup.name == s["name"]).first()
            if existing:
                print(f"  ⏭  Skipping '{s['name']}' (already exists, id={existing.id})")
                skipped += 1
                continue

            startup = Startup(
                founder_id=demo_user.id,
                **s,
            )
            db.add(startup)
            seeded += 1
            print(f"  ✅ Created '{s['name']}' [{s['status']}] trust={100 - s['risk_score']:.0f}/100")

        db.commit()
        print(f"\n✅ Done! Seeded {seeded} startups, skipped {skipped} existing.\n")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
