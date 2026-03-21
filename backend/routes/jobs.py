from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import match_jobs_to_candidate
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# Temporary in-memory storage (we'll add database later)
jobs_db = []


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
async def get_all_jobs():
    """Get all job postings"""
    return {
        "success": True,
        "total": len(jobs_db),
        "jobs": jobs_db
    }


@router.post("/")
async def create_job(job: JobPostingRequest):
    """Create a new job posting"""

    if not job.title or not job.company:
        raise HTTPException(
            status_code=400,
            detail="Job title and company are required"
        )

    new_job = {
        "id": str(uuid.uuid4()),
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "type": job.type,
        "salary": job.salary,
        "requiredSkills": job.required_skills,
        "description": job.description,
        "postedBy": job.posted_by,
        "postedDate": datetime.now().strftime("%Y-%m-%d"),
    }

    jobs_db.append(new_job)

    return {
        "success": True,
        "message": "Job posted successfully",
        "job": new_job
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """Delete a job posting by ID"""

    job = next((j for j in jobs_db if j["id"] == job_id), None)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    jobs_db.remove(job)

    return {
        "success": True,
        "message": "Job deleted successfully"
    }


@router.post("/match")
async def match_jobs(request: JobMatchRequest):
    """AI-powered job matching based on user skills"""

    if not request.user_skills:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one skill"
        )

    if not jobs_db:
        return {
            "success": True,
            "message": "No jobs available to match",
            "matches": []
        }

    try:
        matches = match_jobs_to_candidate(
            user_skills=request.user_skills,
            job_listings=jobs_db
        )
        return {
            "success": True,
            "user_skills": request.user_skills,
            "matches": matches
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )