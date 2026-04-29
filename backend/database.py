from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# For MVP, we will use SQLite to get things running locally without complex setup.
# In a real production deployment, this would be:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgresserver/db"

import os

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./airs.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
