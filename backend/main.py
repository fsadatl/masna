from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import json
from datetime import datetime, timedelta
import os
from fastapi.staticfiles import StaticFiles

from database import get_db, User, Idea, Project, Proposal, Message, Rating, FileUpload

def parse_user_skills(user):
    """Parse user skills from JSON string to list."""
    if hasattr(user, 'skills') and user.skills:
        try:
            user.skills = json.loads(user.skills)
        except (json.JSONDecodeError, TypeError):
            user.skills = []
    elif hasattr(user, 'skills'):
        user.skills = []
    return user
from schemas import (
    UserCreate, UserResponse, UserUpdate,
    IdeaCreate, IdeaResponse, IdeaUpdate,
    ProjectCreate, ProjectResponse, ProjectUpdate,
    ProposalCreate, ProposalResponse, ProposalUpdate,
    MessageCreate, MessageResponse,
    RatingCreate, RatingResponse,
    FileUploadResponse, LoginRequest, Token
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
)

APP_NAME = os.getenv("APP_NAME", "Masna")
app = FastAPI(title=f"{APP_NAME}", version="1.0.0")

# CORS middleware
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
additional_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    # Helpful in dev if you open 0.0.0.0:3000
    "http://0.0.0.0:3000",
]
allow_origins = list({frontend_url, *additional_origins})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
UPLOAD_ROOT = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# Auth endpoints
@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        bio=user.bio,
        skills=json.dumps(user.skills) if user.skills else None,
        portfolio_url=user.portfolio_url
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Convert skills back to list for response
    if db_user.skills:
        db_user.skills = json.loads(db_user.skills)
    
    return db_user

@app.post("/auth/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.get("/users/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user's profile."""
    if current_user.skills:
        current_user.skills = json.loads(current_user.skills)
    return current_user

@app.put("/users/me", response_model=UserResponse)
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile."""
    update_data = user_update.dict(exclude_unset=True)
    
    if "skills" in update_data and update_data["skills"]:
        update_data["skills"] = json.dumps(update_data["skills"])
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    if current_user.skills:
        current_user.skills = json.loads(current_user.skills)
    
    return current_user

# Idea endpoints
@app.post("/ideas", response_model=IdeaResponse)
def create_idea(
    idea: IdeaCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new idea."""
    if current_user.role.value not in ["idea_creator", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only idea creators can create ideas"
        )
    
    db_idea = Idea(
        title=idea.title,
        description=idea.description,
        tags=json.dumps(idea.tags) if idea.tags else None,
        requirements=idea.requirements,
        creator_id=current_user.id
    )
    
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    
    # Load creator relationship and parse skills
    db.refresh(db_idea, ["creator"])
    if db_idea.tags:
        db_idea.tags = json.loads(db_idea.tags)
    if db_idea.creator:
        parse_user_skills(db_idea.creator)
    
    return db_idea

@app.get("/ideas", response_model=List[IdeaResponse])
def get_ideas(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    creator_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all ideas with optional filtering."""
    query = db.query(Idea)
    
    if status:
        query = query.filter(Idea.status == status)
    if creator_id:
        query = query.filter(Idea.creator_id == creator_id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Idea.title.ilike(like), Idea.description.ilike(like)))
    
    ideas = query.offset(skip).limit(limit).all()
    
    # Load creator relationships and parse tags
    for idea in ideas:
        db.refresh(idea, ["creator"])
        if idea.tags:
            idea.tags = json.loads(idea.tags)
        if idea.creator:
            parse_user_skills(idea.creator)
    
    return ideas

@app.get("/ideas/{idea_id}", response_model=IdeaResponse)
def get_idea(idea_id: int, db: Session = Depends(get_db)):
    """Get a specific idea by ID."""
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    db.refresh(idea, ["creator"])
    if idea.tags:
        idea.tags = json.loads(idea.tags)
    if idea.creator:
        parse_user_skills(idea.creator)
    
    return idea

@app.put("/ideas/{idea_id}", response_model=IdeaResponse)
def update_idea(
    idea_id: int,
    idea_update: IdeaUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an idea."""
    idea = db.query(Idea).filter(Idea.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    if idea.creator_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this idea")
    
    update_data = idea_update.dict(exclude_unset=True)
    
    if "tags" in update_data and update_data["tags"]:
        update_data["tags"] = json.dumps(update_data["tags"])
    
    for field, value in update_data.items():
        setattr(idea, field, value)
    
    db.commit()
    db.refresh(idea)
    db.refresh(idea, ["creator"])
    
    if idea.tags:
        idea.tags = json.loads(idea.tags)
    if idea.creator:
        parse_user_skills(idea.creator)
    
    return idea

# Project endpoints
@app.post("/projects", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new project."""
    if current_user.role.value not in ["employer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only employers can create projects"
        )

    # If this project is derived from an idea, prevent duplicates
    existing_project = None
    if project.idea_id is not None:
        existing_project = db.query(Project).filter(Project.idea_id == project.idea_id).first()
        if existing_project:
            # Normalize and return existing to keep operation idempotent
            db.refresh(existing_project)
            db.refresh(existing_project, ["employer", "executor", "idea"])
            if existing_project.idea:
                try:
                    db.refresh(existing_project.idea, ["creator"])
                except Exception:
                    pass
                if getattr(existing_project.idea, "tags", None):
                    try:
                        existing_project.idea.tags = json.loads(existing_project.idea.tags)
                    except Exception:
                        pass
                if getattr(existing_project.idea, "creator", None):
                    parse_user_skills(existing_project.idea.creator)
            if existing_project.employer:
                parse_user_skills(existing_project.employer)
            if existing_project.executor:
                parse_user_skills(existing_project.executor)
            return existing_project

    db_project = Project(
        title=project.title,
        description=project.description,
        budget=project.budget,
        deadline=project.deadline,
        requirements=project.requirements,
        employer_id=current_user.id,
        idea_id=project.idea_id
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # If linked to an idea, update its status to in_project
    if db_project.idea_id:
        idea_obj = db.query(Idea).filter(Idea.id == db_project.idea_id).first()
        if idea_obj and getattr(idea_obj, "status", None) != "in_project":
            try:
                idea_obj.status = "in_project"
                db.commit()
            except Exception:
                db.rollback()

    # Load relationships and normalize nested fields
    db.refresh(db_project, ["employer", "executor", "idea"])
    if db_project.idea:
        try:
            db.refresh(db_project.idea, ["creator"])
        except Exception:
            pass
    if db_project.idea and getattr(db_project.idea, "tags", None):
        try:
            db_project.idea.tags = json.loads(db_project.idea.tags)
        except Exception:
            pass
    if db_project.employer:
        parse_user_skills(db_project.employer)
    if db_project.executor:
        parse_user_skills(db_project.executor)
    if db_project.idea and getattr(db_project.idea, "creator", None):
        parse_user_skills(db_project.idea.creator)
    return db_project

@app.get("/projects", response_model=List[ProjectResponse])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    employer_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all projects with optional filtering."""
    query = db.query(Project)
    
    if status:
        query = query.filter(Project.status == status)
    if employer_id:
        query = query.filter(Project.employer_id == employer_id)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Project.title.ilike(like), Project.description.ilike(like)))
    
    projects = query.offset(skip).limit(limit).all()
    
    # Load relationships and normalize nested fields
    for project in projects:
        db.refresh(project, ["employer", "executor", "idea"])
        if project.idea:
            try:
                db.refresh(project.idea, ["creator"])
            except Exception:
                pass
        if project.idea and getattr(project.idea, "tags", None):
            try:
                project.idea.tags = json.loads(project.idea.tags)
            except Exception:
                pass
        if project.employer:
            parse_user_skills(project.employer)
        if project.executor:
            parse_user_skills(project.executor)
        if project.idea and getattr(project.idea, "creator", None):
            parse_user_skills(project.idea.creator)
    
    return projects

@app.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.refresh(project, ["employer", "executor", "idea"])
    if project.idea:
        try:
            db.refresh(project.idea, ["creator"])
        except Exception:
            pass
    if project.idea and getattr(project.idea, "tags", None):
        try:
            project.idea.tags = json.loads(project.idea.tags)
        except Exception:
            pass
    if project.employer:
        parse_user_skills(project.employer)
    if project.executor:
        parse_user_skills(project.executor)
    if project.idea and getattr(project.idea, "creator", None):
        parse_user_skills(project.idea.creator)
    return project

# Proposal endpoints
@app.post("/proposals", response_model=ProposalResponse)
def create_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a proposal for a project."""
    if current_user.role.value not in ["executor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only executors can create proposals"
        )
    
    # Check if project exists
    project = db.query(Project).filter(Project.id == proposal.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user already has a proposal for this project
    existing_proposal = db.query(Proposal).filter(
        Proposal.project_id == proposal.project_id,
        Proposal.executor_id == current_user.id
    ).first()
    
    if existing_proposal:
        raise HTTPException(
            status_code=400,
            detail="You already have a proposal for this project"
        )
    
    db_proposal = Proposal(
        project_id=proposal.project_id,
        executor_id=current_user.id,
        proposed_price=proposal.proposed_price,
        proposed_timeline=proposal.proposed_timeline,
        cover_letter=proposal.cover_letter
    )
    
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    
    # Load executor relationship
    db.refresh(db_proposal, ["executor"])
    
    return db_proposal

@app.get("/projects/{project_id}/proposals", response_model=List[ProposalResponse])
def get_project_proposals(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all proposals for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Only project employer can see proposals
    if project.employer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view proposals")
    
    proposals = db.query(Proposal).filter(Proposal.project_id == project_id).all()
    
    # Load executor relationships
    for proposal in proposals:
        db.refresh(proposal, ["executor"])
    
    return proposals

@app.put("/proposals/{proposal_id}", response_model=ProposalResponse)
def update_proposal_status(
@app.get("/proposals/me", response_model=List[ProposalResponse])
def get_my_proposals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all proposals created by the current executor user."""
    query = db.query(Proposal)
    if current_user.role.value != "admin":
        query = query.filter(Proposal.executor_id == current_user.id)
    proposals = query.order_by(Proposal.created_at.desc()).all()
    for p in proposals:
        db.refresh(p, ["executor"])  # ensure executor relation is loaded
    return proposals
    proposal_id: int,
    proposal_update: ProposalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update proposal status (accept/reject)."""
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    project = db.query(Project).filter(Project.id == proposal.project_id).first()
    
    # Only project employer can update proposal status
    if project.employer_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update proposal")
    
    update_data = proposal_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(proposal, field, value)
    
    # If proposal is accepted, assign executor to project
    if proposal_update.status == "accepted":
        project.executor_id = proposal.executor_id
        project.status = "in_progress"
    
    db.commit()
    db.refresh(proposal)
    db.refresh(proposal, ["executor"])
    
    return proposal

# File upload endpoints
@app.post("/projects/{project_id}/files", response_model=FileUploadResponse)
async def upload_project_file(
    project_id: int,
    file: UploadFile = File(...),
    is_final_delivery: bool = Form(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a file for a project by employer or assigned executor."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only employer or assigned executor can upload
    if current_user.id not in [project.employer_id, project.executor_id] and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to upload files for this project")

    # Ensure project upload directory exists
    project_dir = os.path.join(UPLOAD_ROOT, f"project_{project_id}")
    os.makedirs(project_dir, exist_ok=True)

    # Sanitize filename minimally
    filename = os.path.basename(file.filename)
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    stored_name = f"{timestamp}_{filename}"
    file_path = os.path.join(project_dir, stored_name)

    # Save file to disk
    with open(file_path, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    # Prepare DB record
    rel_url = f"/uploads/project_{project_id}/{stored_name}"
    db_file = FileUpload(
        project_id=project_id,
        uploaded_by=current_user.id,
        filename=filename,
        file_url=rel_url,
        file_type=file.content_type,
        is_final_delivery=is_final_delivery,
    )
    try:
        size = os.path.getsize(file_path)
        db_file.file_size = size
    except Exception:
        pass

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file

@app.get("/projects/{project_id}/files", response_model=List[FileUploadResponse])
def list_project_files(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List files for a project (visible to employer, assigned executor, or admin)."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.id not in [project.employer_id, project.executor_id] and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view files for this project")

    files = db.query(FileUpload).filter(FileUpload.project_id == project_id).all()
    return files

# Dashboard stats endpoint
@app.get("/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Return simple counts for dashboard depending on the user role."""
    # Ideas created by user
    ideas_count = db.query(Idea).filter(Idea.creator_id == current_user.id).count()

    # Projects where user is employer or executor
    projects_count = db.query(Project).filter(
        or_(Project.employer_id == current_user.id, Project.executor_id == current_user.id)
    ).count()

    # Proposals: if executor, proposals by user; if employer, proposals on user's projects
    if current_user.role.value == "executor":
        proposals_count = db.query(Proposal).filter(Proposal.executor_id == current_user.id).count()
    else:
        # projects the user owns as employer
        rows = db.query(Project.id).filter(Project.employer_id == current_user.id).all()
        user_project_ids = [r[0] for r in rows]
        if user_project_ids:
            proposals_count = db.query(Proposal).filter(Proposal.project_id.in_(user_project_ids)).count()
        else:
            proposals_count = 0

    # Completed projects where user is involved
    completed_projects = db.query(Project).filter(
        or_(Project.employer_id == current_user.id, Project.executor_id == current_user.id),
        Project.status == "completed"
    ).count()

    return {
        "ideas_count": ideas_count,
        "projects_count": projects_count,
        "proposals_count": proposals_count,
        "completed_projects": completed_projects,
    }

# Message endpoints
@app.post("/messages", response_model=MessageResponse)
def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message."""
    # Verify project exists and user is involved
    project = db.query(Project).filter(Project.id == message.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.employer_id != current_user.id and project.executor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send messages for this project")
    
    db_message = Message(
        project_id=message.project_id,
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Load sender relationship
    db.refresh(db_message, ["sender"])
    
    return db_message

@app.get("/projects/{project_id}/messages", response_model=List[MessageResponse])
def get_project_messages(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all messages for a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.employer_id != current_user.id and project.executor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view messages for this project")
    
    messages = db.query(Message).filter(Message.project_id == project_id).all()
    
    # Load sender relationships
    for message in messages:
        db.refresh(message, ["sender"])
    
    return messages

# Rating endpoints
@app.post("/ratings", response_model=RatingResponse)
def create_rating(
    rating: RatingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a rating for a user."""
    # Verify project exists and user is involved
    project = db.query(Project).filter(Project.id == rating.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.employer_id != current_user.id and project.executor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to rate for this project")
    
    # Check if rating already exists
    existing_rating = db.query(Rating).filter(
        Rating.project_id == rating.project_id,
        Rating.rater_id == current_user.id
    ).first()
    
    if existing_rating:
        raise HTTPException(status_code=400, detail="You already rated this project")
    
    db_rating = Rating(
        rater_id=current_user.id,
        rated_user_id=rating.rated_user_id,
        project_id=rating.project_id,
        rating=rating.rating,
        comment=rating.comment
    )
    
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    
    # Load rater relationship
    db.refresh(db_rating, ["rater"])
    
    return db_rating

@app.get("/users/{user_id}/ratings", response_model=List[RatingResponse])
def get_user_ratings(user_id: int, db: Session = Depends(get_db)):
    """Get all ratings for a user."""
    ratings = db.query(Rating).filter(Rating.rated_user_id == user_id).all()
    
    # Load rater relationships
    for rating in ratings:
        db.refresh(rating, ["rater"])
    
    return ratings

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
