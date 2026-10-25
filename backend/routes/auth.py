from fastapi import APIRouter, Depends, HTTPException, status, Security
from pydantic import BaseModel
from typing import Literal
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from models.job import JobPosting
from models.application import JobApplication, Notification
from models.job_alert import JobAlertPreference
from deps import get_current_user, require_recruiter, security
from fastapi.security import HTTPAuthorizationCredentials
from services.storage_service import delete_resume
from services.account_deletion import delete_supabase_auth_user, get_supabase_user_id

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# --- Request Models ---
class SyncUserRequest(BaseModel):
    name: str
    user_type: str  # "jobseeker" or "recruiter"


class DeleteAccountRequest(BaseModel):
    confirmation: Literal["DELETE"]

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


@router.delete("/account")
async def delete_my_account(
    request: DeleteAccountRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently remove the caller's application data and Supabase identity."""
    try:
        supabase_user_id = await get_supabase_user_id(credentials.credentials)
        recruiter_jobs = db.query(JobPosting.id).filter(JobPosting.posted_by_id == current_user.id).all()
        recruiter_job_ids = [job_id for (job_id,) in recruiter_jobs]
        application_filter = JobApplication.candidate_id == current_user.id
        if recruiter_job_ids:
            application_filter = or_(application_filter, JobApplication.job_id.in_(recruiter_job_ids))
        applications = db.query(JobApplication).filter(application_filter).all()
        resume_paths = {app.resume_path for app in applications if app.resume_path}
        resume_paths.update(
            path for (path,) in db.query(ResumeAnalysis.resume_path)
            .filter(ResumeAnalysis.user_id == current_user.id).all() if path
        )

        # Storage is cleaned before the database/auth records are removed, so
        # a failure never leaves resumés orphaned behind an "deleted" account.
        for resume_path in resume_paths:
            await delete_resume(resume_path)

        db.query(Notification).filter(Notification.user_id == current_user.id).delete(synchronize_session=False)
        db.query(JobAlertPreference).filter(JobAlertPreference.user_id == current_user.id).delete(synchronize_session=False)
        db.query(JobApplication).filter(application_filter).delete(synchronize_session=False)
        if recruiter_job_ids:
            db.query(JobPosting).filter(JobPosting.id.in_(recruiter_job_ids)).delete(synchronize_session=False)
        db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete(synchronize_session=False)
        db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).delete(synchronize_session=False)
        db.query(UserProfile).filter(UserProfile.user_id == current_user.id).delete(synchronize_session=False)

        # Remove Auth before committing the local transaction. If Supabase
        # rejects the delete, the session rolls back and no local data is lost.
        await delete_supabase_auth_user(supabase_user_id)
        db.delete(current_user)
        db.commit()
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Account deletion could not be completed")

    return {"success": True, "message": "Account permanently deleted"}
