#!/usr/bin/env python3
"""Initialize TrustBridge database tables"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from app.db.base import Base
from app.db.models import (
    User, Startup, Investment, Employee, Attestation, 
    Milestone, ValidationReport, GroundAgentApplication
)

def init_db():
    print("Initializing TrustBridge database...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Verify
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"Created {len(tables)} tables:")
    for table in tables:
        print(f"   - {table}")
    
    print("\nDatabase ready!")

if __name__ == "__main__":
    init_db()
