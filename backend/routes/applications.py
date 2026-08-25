from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import uuid
from datetime import datetime, timezone

from models.application import JobApplication, Notification, ALLOWED_STATUSES
from models.job import JobPosting
from models.user import User
from deps import get_current_user, require_recruiter

router = APIRouter(prefix="/applications", tags=["Applications"])

class ApplicationRequest(BaseModel):
    candidate_id: str | None = None

class StatusUpdateRequest(BaseModel):
    status: str

# ---------------------------
# Candidate applies for job
# ---------------------------
@router.post("/apply/{job_id}")
def apply_for_job(
    job_id: str,
    req: ApplicationRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        valid_job_id = uuid.UUID(job_id)
        valid_candidate_id = current_user.id
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    job = db.query(JobPosting).filter(JobPosting.id == valid_job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == valid_job_id,
        JobApplication.candidate_id == valid_candidate_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    application = JobApplication(
        job_id=valid_job_id,
        candidate_id=valid_candidate_id,
        status="applied"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully",
        "application_id": str(application.id)
    }


# ---------------------------------
# Recruiter view job applications
# ---------------------------------
@router.get("/job/{job_id}")
def get_job_applications(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    try:
        valid_job_id = uuid.UUID(job_id)
    except ValueError:
        return {"job_id": job_id, "applications": []}

    applications = db.query(JobApplication).filter(
        JobApplication.job_id == valid_job_id
    ).all()

    results = []

    for app in applications:
        user = db.query(User).filter(User.id == app.candidate_id).first()
        if user:
            results.append({
                "application_id": str(app.id),
                "candidate_id": str(user.id),
                "name": user.name,
                "email": user.email,
                "status": app.status
            })

    return {
        "job_id": job_id,
        "applications": results
    }


# ---------------------------------
# Recruiter updates application status
# ---------------------------------
@router.patch("/{application_id}/status")
def update_application_status(
    application_id: str,
    req: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    if req.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ALLOWED_STATUSES}")

    try:
        valid_id = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application_id format")

    application = db.query(JobApplication).filter(JobApplication.id == valid_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first()
    if not job or job.posted_by != current_user.name:
        raise HTTPException(status_code=403, detail="You can only update applications for your own job postings")

    application.status = req.status
    application.updated_at = datetime.now(timezone.utc)

    notification = Notification(
        user_id=application.candidate_id,
        message=f"Your application for '{job.title}' is now {req.status}."
    )
    db.add(notification)

    db.commit()
    db.refresh(application)

    return {"success": True, "application_id": str(application.id), "status": application.status}


# ---------------------------------
# Jobseeker views own applications
# ---------------------------------
@router.get("/my")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    applications = db.query(JobApplication).filter(
        JobApplication.candidate_id == current_user.id
    ).order_by(JobApplication.applied_at.desc()).all()

    results = []
    for app in applications:
        job = db.query(JobPosting).filter(JobPosting.id == app.job_id).first()
        results.append({
            "application_id": str(app.id),
            "job_id": str(app.job_id),
            "job_title": job.title if job else "Unknown",
            "company": job.company if job else "Unknown",
            "status": app.status,
            "applied_at": str(app.applied_at) if app.applied_at else ""
        })

    return {"success": True, "total": len(results), "applications": results}


# ---------------------------------
# Applications-over-time for a job (recruiter analytics)
# ---------------------------------
@router.get("/job/{job_id}/timeseries")
def get_job_application_timeseries(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    try:
        valid_job_id = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    rows = (
        db.query(func.date(JobApplication.applied_at).label("day"), func.count(JobApplication.id))
        .filter(JobApplication.job_id == valid_job_id)
        .group_by("day")
        .order_by("day")
        .all()
    )

    return {
        "success": True,
        "job_id": job_id,
        "series": [{"date": str(day), "count": count} for day, count in rows]
    }


# ---------------------------------
# Notifications
# ---------------------------------
@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

    return {
        "success": True,
        "unread_count": sum(1 for n in notifications if n.is_read == "false"),
        "notifications": [
            {
                "id": str(n.id),
                "message": n.message,
                "is_read": n.is_read == "true",
                "created_at": str(n.created_at)
            }
            for n in notifications
        ]
    }


@router.post("/notifications/mark-read")
def mark_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == "false"
    ).update({"is_read": "true"})
    db.commit()
    return {"success": True}