from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

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

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Idea schemas
class IdeaBase(BaseModel):
    title: str
    description: str
    tags: Optional[List[str]] = None
    requirements: Optional[str] = None

class IdeaCreate(IdeaBase):
    pass

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    requirements: Optional[str] = None
    status: Optional[IdeaStatus] = None

class IdeaResponse(IdeaBase):
    id: int
    status: IdeaStatus
    creator_id: int
    executor_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    title: str
    description: str
    budget: Optional[float] = None
    deadline: Optional[datetime] = None
    requirements: Optional[str] = None

class ProjectCreate(ProjectBase):
    idea_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[datetime] = None
    requirements: Optional[str] = None
    status: Optional[ProjectStatus] = None
    executor_id: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: int
    status: ProjectStatus
    employer_id: int
    executor_id: Optional[int] = None
    idea_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    employer: Optional[UserResponse] = None
    executor: Optional[UserResponse] = None
    idea: Optional[IdeaResponse] = None
    
    class Config:
        from_attributes = True

# Proposal schemas
class ProposalBase(BaseModel):
    proposed_price: Optional[float] = None
    proposed_timeline: Optional[str] = None
    cover_letter: Optional[str] = None

class ProposalCreate(ProposalBase):
    project_id: int

class ProposalUpdate(BaseModel):
    proposed_price: Optional[float] = None
    proposed_timeline: Optional[str] = None
    cover_letter: Optional[str] = None
    status: Optional[ProposalStatus] = None

class ProposalResponse(ProposalBase):
    id: int
    project_id: int
    executor_id: int
    status: ProposalStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    executor: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int
    project_id: int

class MessageResponse(MessageBase):
    id: int
    project_id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime
    sender: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Rating schemas
class RatingBase(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None

class RatingCreate(RatingBase):
    rated_user_id: int
    project_id: int

class RatingResponse(RatingBase):
    id: int
    rater_id: int
    rated_user_id: int
    project_id: int
    created_at: datetime
    rater: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# File upload schemas
class FileUploadBase(BaseModel):
    filename: str
    file_url: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_final_delivery: bool = False

class FileUploadCreate(FileUploadBase):
    project_id: int

class FileUploadResponse(FileUploadBase):
    id: int
    project_id: int
    uploaded_by: int
    created_at: datetime
    uploader: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
