from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from enum import Enum
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/idea_project_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserRole(str, Enum):
    IDEA_CREATOR = "idea_creator"
    EXECUTOR = "executor"
    EMPLOYER = "employer"
    ADMIN = "admin"

class ProjectStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class IdeaStatus(str, Enum):
    UNDER_REVIEW = "under_review"
    IN_PROJECT = "in_project"
    REJECTED = "rejected"

class ProposalStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    avatar_url = Column(String)
    bio = Column(Text)
    skills = Column(Text)  # JSON string of skills
    portfolio_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    ideas = relationship("Idea", foreign_keys="Idea.creator_id", back_populates="creator")
    projects_as_employer = relationship("Project", foreign_keys="Project.employer_id", back_populates="employer")
    proposals = relationship("Proposal", foreign_keys="Proposal.executor_id", back_populates="executor")
    ratings_given = relationship("Rating", foreign_keys="Rating.rater_id", back_populates="rater")
    ratings_received = relationship("Rating", foreign_keys="Rating.rated_user_id", back_populates="rated_user")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    messages_received = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

class Idea(Base):
    __tablename__ = "ideas"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    tags = Column(Text)  # JSON string of tags
    requirements = Column(Text)
    status = Column(SQLEnum(IdeaStatus), default=IdeaStatus.UNDER_REVIEW)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    executor_id = Column(Integer, ForeignKey("users.id"))  # If idea becomes a project
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[creator_id], back_populates="ideas")
    executor = relationship("User", foreign_keys=[executor_id])

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    budget = Column(Float)
    deadline = Column(DateTime(timezone=True))
    requirements = Column(Text)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.NEW)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    executor_id = Column(Integer, ForeignKey("users.id"))
    idea_id = Column(Integer, ForeignKey("ideas.id"))  # If project comes from an idea
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employer = relationship("User", foreign_keys=[employer_id], back_populates="projects_as_employer")
    executor = relationship("User", foreign_keys=[executor_id])
    idea = relationship("Idea")
    proposals = relationship("Proposal", back_populates="project")
    messages = relationship("Message", back_populates="project")

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    executor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposed_price = Column(Float)
    proposed_timeline = Column(String)
    cover_letter = Column(Text)
    status = Column(SQLEnum(ProposalStatus), default=ProposalStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="proposals")
    executor = relationship("User", back_populates="proposals")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="messages_received")

class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rated_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    rater = relationship("User", foreign_keys=[rater_id], back_populates="ratings_given")
    rated_user = relationship("User", foreign_keys=[rated_user_id], back_populates="ratings_received")
    project = relationship("Project")

class FileUpload(Base):
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    is_final_delivery = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project")
    uploader = relationship("User")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
