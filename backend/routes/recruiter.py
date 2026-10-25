from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from services.match_services import match_candidates_for_job
from models.job import JobPosting
from models.user import User
from models.application import Invitation, JobApplication, Notification
from deps import require_recruiter
from services.candidate_communications import send_job_invitation_email
import uuid
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])


@router.get("/job/{job_id}/matches")
def get_candidate_matches(
    job_id: str,
    location: str | None = Query(default=None),
    min_experience: int = Query(default=0, ge=0, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    matches = match_candidates_for_job(db, job_id, location, min_experience)

    return {
        "job_id": job_id,
        "matches": matches
    }

@router.get("/dashboard")
def recruiter_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    jobs = db.query(JobPosting).count()
    candidates = db.query(User).filter(User.user_type == "jobseeker").count()

    return {
        "total_jobs": jobs,
        "total_candidates": candidates
    }


@router.post("/job/{job_id}/invite/{candidate_id}")
def invite_candidate(
    job_id: str,
    candidate_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Invite a sourced jobseeker to apply to one of the recruiter's jobs."""
    try:
        valid_job_id = uuid.UUID(job_id)
        valid_candidate_id = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job or candidate id")

    job = db.query(JobPosting).filter(JobPosting.id == valid_job_id).first()
    if not job or job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only invite candidates to your own job postings")

    candidate = db.query(User).filter(User.id == valid_candidate_id, User.user_type == "jobseeker").first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if db.query(JobApplication).filter(
        JobApplication.job_id == job.id, JobApplication.candidate_id == candidate.id
    ).first():
        raise HTTPException(status_code=409, detail="Candidate has already applied to this job")

    invitation = db.query(Invitation).filter(
        Invitation.job_id == job.id, Invitation.candidate_id == candidate.id
    ).first()
    if invitation:
        return {"success": True, "invitation_id": str(invitation.id), "invited": False}

    invitation = Invitation(job_id=job.id, candidate_id=candidate.id, invited_by_user_id=current_user.id)
    db.add(invitation)
    db.add(Notification(
        user_id=candidate.id,
        message=f"You have been invited to apply for '{job.title}' at {job.company}.",
    ))
    db.commit()
    db.refresh(invitation)

    if candidate.email:
        frontend_url = os.getenv("FRONTEND_URL", "https://skillnuron-ai.vercel.app").rstrip("/")
        background_tasks.add_task(
            send_job_invitation_email,
            candidate_email=candidate.email,
            candidate_name=candidate.name or "",
            job_title=job.title,
            company=job.company,
            apply_url=f"{frontend_url}/?invite_job={job.id}",
        )
    return {"success": True, "invitation_id": str(invitation.id), "invited": True}
