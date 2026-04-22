from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import uuid

from models.application import JobApplication
from models.job import JobPosting
from models.user import User

router = APIRouter(prefix="/applications", tags=["Applications"])

# FIXED: Use a Pydantic model so candidate_id is sent securely in the JSON body
class ApplicationRequest(BaseModel):
    candidate_id: str

# ---------------------------
# Candidate applies for job
# ---------------------------
@router.post("/apply/{job_id}")
def apply_for_job(
    job_id: str,
    req: ApplicationRequest,
    db: Session = Depends(get_db)
):
    # FIXED: Validate UUIDs to prevent 500 Internal Server Errors
    try:
        valid_job_id = uuid.UUID(job_id)
        valid_candidate_id = uuid.UUID(req.candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id or candidate_id format")

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
    db: Session = Depends(get_db)
):
    # FIXED: Safety check for UUID
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
                "name": user.name, # FIXED: Added Name for the UI
                "email": user.email,
                "status": app.status
            })

    return {
        "job_id": job_id,
        "applications": results
    }