from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.job import JobPosting
from services.ai_service import match_jobs_to_candidate
import uuid

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


# --- Request Models ---

class JobPostingRequest(BaseModel):
    title: str
    company: str
    location: str
    type: str
    salary: str
    required_skills: list[str]
    description: str
    posted_by: str


class JobMatchRequest(BaseModel):
    user_skills: list[str]


# --- Endpoints ---

@router.get("/")
async def get_all_jobs(db: Session = Depends(get_db)):
    """Get all job postings from PostgreSQL"""
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    return {
        "success": True,
        "total": len(jobs),
        "jobs": [
            {
                "id": str(j.id),
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "type": j.type,
                "salary": j.salary,
                "requiredSkills": j.required_skills or [],
                "description": j.description,
                "postedBy": j.posted_by,
                "postedDate": str(j.created_at.date()) if j.created_at else ""
            }
            for j in jobs
        ]
    }


@router.post("/")
async def create_job(job: JobPostingRequest, db: Session = Depends(get_db)):
    """Create a new job posting — saves to PostgreSQL"""

    if not job.title or not job.company:
        raise HTTPException(status_code=400, detail="Job title and company are required")

    new_job = JobPosting(
        title=job.title,
        company=job.company,
        location=job.location,
        type=job.type,
        salary=job.salary,
        required_skills=job.required_skills,
        description=job.description,
        posted_by=job.posted_by
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "success": True,
        "message": "Job posted successfully",
        "job": {
            "id": str(new_job.id),
            "title": new_job.title,
            "company": new_job.company,
            "location": new_job.location,
            "type": new_job.type,
            "salary": new_job.salary,
            "requiredSkills": new_job.required_skills or [],
            "description": new_job.description,
            "postedBy": new_job.posted_by,
            "postedDate": str(new_job.created_at.date())
        }
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Delete a job posting from PostgreSQL"""

    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"success": True, "message": "Job deleted successfully"}


@router.post("/match")
async def match_jobs(request: JobMatchRequest, db: Session = Depends(get_db)):
    """AI-powered job matching using real jobs from PostgreSQL"""

    if not request.user_skills:
        raise HTTPException(status_code=400, detail="Please provide at least one skill")

    jobs = db.query(JobPosting).all()

    if not jobs:
        return {
            "success": True,
            "message": "No jobs available yet",
            "matches": []
        }

    job_listings = [
        {
            "id": str(j.id),
            "title": j.title,
            "company": j.company,
            "requiredSkills": j.required_skills or []
        }
        for j in jobs
    ]

    try:
        matches = match_jobs_to_candidate(
            user_skills=request.user_skills,
            job_listings=job_listings
        )
        return {
            "success": True,
            "user_skills": request.user_skills,
            "matches": matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")
