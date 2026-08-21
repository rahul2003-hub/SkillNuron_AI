from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from deps import get_current_user, require_recruiter

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# --- Request Models ---
class SyncUserRequest(BaseModel):
    name: str
    user_type: str  # "jobseeker" or "recruiter"

@router.post("/sync")
async def sync_user(
    req: SyncUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Synchronize user metadata with PostgreSQL after Supabase authentication"""
    if req.name and req.name.strip():
        current_user.name = req.name.strip()
    if req.user_type in ["jobseeker", "recruiter"]:
        current_user.user_type = req.user_type
        
    db.commit()
    db.refresh(current_user)

    return {
        "success": True,
        "message": "User sync successful",
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "user_type": current_user.user_type
        }
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Return authenticated current user profile"""
    return {
        "success": True,
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "user_type": current_user.user_type,
            "created_at": str(current_user.created_at)
        }
    }

@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    """Protected endpoint — only accessible to recruiters"""
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "user_type": u.user_type,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }