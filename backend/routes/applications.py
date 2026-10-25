from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import uuid
from datetime import datetime, timezone

from models.application import JobApplication, Notification, ApplicationEvent, Invitation, ALLOWED_STATUSES, move_stage
from models.job import JobPosting
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from deps import get_current_user, require_recruiter
from services.storage_service import SUPABASE_SERVICE_KEY, upload_resume, get_resume_signed_url
from services.match_services import evaluate_location_fit, calculate_match_score, get_cached_ai_match
from services.candidate_communications import (
    send_application_status_email,
    send_recruiter_new_application_email,
)

router = APIRouter(prefix="/applications", tags=["Applications"])

class StatusUpdateRequest(BaseModel):
    status: str
    note: str = ""

@router.post("/apply/{job_id}")
async def apply_for_job(
    job_id: str,
    background_tasks: BackgroundTasks,
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

    invitation = db.query(Invitation).filter(
        Invitation.job_id == valid_job_id,
        Invitation.candidate_id == valid_candidate_id,
        Invitation.accepted_at.is_(None),
    ).first()
    application = JobApplication(
        job_id=valid_job_id,
        candidate_id=valid_candidate_id,
        status="applied",
        cover_letter=cover_letter.strip(),
        expected_salary=expected_salary.strip(),
        resume_path=resume_path,
        resume_filename=resume_filename,
        source="invited" if invitation else "direct",
    )

    recruiter = None
    db.add(application)
    if invitation:
        invitation.accepted_at = datetime.now(timezone.utc)
    if job.posted_by_id:
        recruiter = db.query(User).filter(User.id == job.posted_by_id).first()
        db.add(Notification(
            user_id=job.posted_by_id,
            message=f"New application from {current_user.name} for '{job.title}'."
        ))
    db.commit()
    db.refresh(application)

    if recruiter and recruiter.email:
        background_tasks.add_task(
            send_recruiter_new_application_email,
            recruiter_email=recruiter.email,
            recruiter_name=recruiter.name or "",
            candidate_name=current_user.name or "",
            job_title=job.title,
        )

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
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            cand_location = profile.location if profile else ""
            skills = [s.skill_name for s in db.query(UserSkill).filter(UserSkill.user_id == user.id).all()]
            resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == user.id).first()

            loc_eval = evaluate_location_fit(job.location, job.type, cand_location)
            job_skills = job.required_skills or []
            fast_skill_score = calculate_match_score(job_skills, skills)

            try:
                ai_eval = get_cached_ai_match(job_skills, skills)
                skill_score = ai_eval.get("match_score", fast_skill_score)
            except Exception as e:
                ai_eval = {
                    "match_score": fast_skill_score,
                    "reason": "AI evaluation temporarily unavailable. Score based on keyword matching.",
                    "missing_skills": []
                }
                skill_score = fast_skill_score

            match_score = int(round(skill_score * loc_eval["multiplier"]))

            results.append({
                "application_id": str(app.id),
                "candidate_id": str(user.id),
                "name": user.name,
                "email": user.email,
                "status": app.status,
                "source": app.source,
                "cover_letter": app.cover_letter or "",
                "expected_salary": app.expected_salary or "",
                "resume_filename": app.resume_filename,
                "has_resume": bool(app.resume_path),
                "location": cand_location,
                "location_fit": loc_eval,
                "ats_score": resume.overall_score if resume else None,
                "skill_match_score": skill_score,
                "match_score": match_score,
                "skills": skills,
                "ai_evaluation": ai_eval,
                "applied_at": str(app.applied_at.date()) if app.applied_at else "",
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    if req.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ALLOWED_STATUSES}")
    if len(req.note) > 2000:
        raise HTTPException(status_code=400, detail="Note must be 2000 characters or fewer")

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

    previous_status = application.status
    if previous_status == req.status:
        return {
            "success": True,
            "application_id": str(application.id),
            "status": application.status,
            "changed": False,
        }

    candidate = db.query(User).filter(User.id == application.candidate_id).first()
    move_stage(db, application, req.status, current_user, req.note.strip())

    db.commit()
    db.refresh(application)

    # A mail failure must never roll back a successfully persisted status change.
    if candidate and candidate.email:
        background_tasks.add_task(
            send_application_status_email,
            candidate_email=candidate.email,
            candidate_name=candidate.name or "",
            job_title=job.title,
            status=req.status,
        )

    return {
        "success": True,
        "application_id": str(application.id),
        "status": application.status,
        "previous_status": previous_status,
        "changed": True,
    }


@router.get("/{application_id}/history")
def get_application_history(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Return the pipeline audit trail to the recruiter who owns the job."""
    try:
        valid_id = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application_id format")

    application = db.query(JobApplication).filter(JobApplication.id == valid_id).first()
    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first() if application else None
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if not job or job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view history for applications to your own job postings")

    events = db.query(ApplicationEvent).filter(
        ApplicationEvent.application_id == application.id
    ).order_by(ApplicationEvent.created_at.desc()).all()
    return {
        "success": True,
        "application_id": str(application.id),
        "events": [{
            "id": str(event.id), "from_stage": event.from_stage,
            "to_stage": event.to_stage, "by_user_id": str(event.by_user_id),
            "by_user_name": event.by_user.name if event.by_user else None,
            "note": event.note or "", "created_at": str(event.created_at),
        } for event in events],
    }


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    """Allow recruiter to remove an application from their post."""
    try:
        valid_id = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid application_id format")

    application = db.query(JobApplication).filter(JobApplication.id == valid_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(JobPosting).filter(JobPosting.id == application.job_id).first()
    if not job or job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete applications for your own job postings")

    db.delete(application)
    db.commit()

    return {"success": True, "message": "Application removed successfully"}


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
            "source": app.source,
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
