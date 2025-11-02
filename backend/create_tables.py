# Database Migration Script
import os
import sys
from sqlalchemy import create_engine
from database import Base

def create_tables():
    """Create all database tables."""
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/idea_project_db")
    engine = create_engine(database_url)
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()
