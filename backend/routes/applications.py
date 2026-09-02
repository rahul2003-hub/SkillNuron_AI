from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
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
from services.storage_service import SUPABASE_SERVICE_KEY, upload_resume, get_resume_signed_url

router = APIRouter(prefix="/applications", tags=["Applications"])

class StatusUpdateRequest(BaseModel):
    status: str

@router.post("/apply/{job_id}")
async def apply_for_job(
    job_id: str,
    resume: UploadFile | None = File(None),
    cover_letter: str = Form(""),
    expected_salary: str = Form(""),
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

    resume_path = None
    resume_filename = None
    if resume:
        resume_filename = resume.filename or "resume"
        if not resume_filename.lower().endswith((".pdf", ".doc", ".docx")):
            raise HTTPException(status_code=400, detail="Resume must be a PDF, DOC, or DOCX file")
        file_bytes = await resume.read()
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Resume must be 5MB or smaller")
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Resume file is empty")
        try:
            resume_path = await upload_resume(
                str(current_user.id),
                f"applications/{uuid.uuid4()}_{resume_filename}",
                file_bytes,
                resume.content_type or "application/octet-stream",
            )
        except Exception as exc:
            detail = (
                "Resume storage is not configured. Add SUPABASE_SERVICE_KEY to backend/.env."
                if not SUPABASE_SERVICE_KEY else "Resume upload failed. Please try again."
            )
            raise HTTPException(status_code=502, detail=detail) from exc

    application = JobApplication(
        job_id=valid_job_id,
        candidate_id=valid_candidate_id,
        status="applied",
        cover_letter=cover_letter.strip(),
        expected_salary=expected_salary.strip(),
        resume_path=resume_path,
        resume_filename=resume_filename,
    )

    db.add(application)
    if job.posted_by_id:
        db.add(Notification(
            user_id=job.posted_by_id,
            message=f"New application from {current_user.name} for '{job.title}'."
        ))
    db.commit()
    db.refresh(application)

    return {
        "message": "Applied successfully",
        "application_id": str(application.id)
    }


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

    job = db.query(JobPosting).filter(JobPosting.id == valid_job_id).first()
    if not job or job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view applications for your own job postings")

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
                "status": app.status,
                "cover_letter": app.cover_letter or "",
                "expected_salary": app.expected_salary or "",
                "resume_filename": app.resume_filename,
                "has_resume": bool(app.resume_path),
            })

    return {
        "job_id": job_id,
        "applications": results
    }


@router.get("/{application_id}/resume")
async def get_application_resume(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Return a short-lived resume URL only to the recruiter who owns the job."""
    try:
        valid_id = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application_id format")

    application = db.query(JobApplication).filter(JobApplication.id == valid_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first() if application else None
    if not application or not job or job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not application.resume_path:
        raise HTTPException(status_code=404, detail="No resume uploaded for this application")

    return {"success": True, "url": await get_resume_signed_url(application.resume_path)}


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

    # Strict ownership check via posted_by_id FK. A job with no
    # posted_by_id recorded is NOT implicitly open to any recruiter.
    if not job or job.posted_by_id != current_user.id:
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


@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

    def is_read(value):
        return value is True or value == "true" or value == 1

    return {
        "success": True,
        "unread_count": sum(1 for n in notifications if not is_read(n.is_read)),
        "notifications": [
            {
                "id": str(n.id),
                "message": n.message,
                "is_read": is_read(n.is_read),
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
