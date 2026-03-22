from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.job import JobPosting
from services.ai_service import match_jobs_to_candidate
import uuid
import os
import httpx

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

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

@router.get("/search")
async def search_jobs_adzuna(
    keywords: str = "software developer",
    location: str = "Mumbai",
    results: int = 10
):
    """Search real Indian jobs from Adzuna API"""

    # Indian city mapping for Adzuna
    city_map = {
        "Mumbai": "mumbai",
        "Pune": "pune",
        "Bangalore": "bangalore",
        "Hyderabad": "hyderabad",
        "Delhi": "delhi",
        "Noida": "noida",
        "Chennai": "chennai",
        "Navi Mumbai": "navi-mumbai",
        "Kolkata": "kolkata",
        "Ahmedabad": "ahmedabad"
    }

    adzuna_location = city_map.get(location, location.lower())

    url = (
        f"https://api.adzuna.com/v1/api/jobs/in/search/1"
        f"?app_id={ADZUNA_APP_ID}"
        f"&app_key={ADZUNA_APP_KEY}"
        f"&results_per_page={results}"
        f"&what={keywords}"
        f"&where={adzuna_location}"
        f"&content-type=application/json"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            data = response.json()

        if "results" not in data:
            return {
                "success": False,
                "message": "No results from Adzuna",
                "jobs": []
            }

        jobs = []
        for job in data["results"]:
            # Convert salary from GBP/USD hint to INR estimate
            salary_min = job.get("salary_min")
            salary_max = job.get("salary_max")

            if salary_min and salary_max:
                # Adzuna India returns INR values
                salary_str = f"₹{int(salary_min):,} - ₹{int(salary_max):,} per annum"
            else:
                salary_str = "Salary not disclosed"

            jobs.append({
                "id": job.get("id", ""),
                "title": job.get("title", ""),
                "company": job.get("company", {}).get("display_name", "Company"),
                "location": job.get("location", {}).get("display_name", location),
                "salary": salary_str,
                "description": job.get("description", "")[:300] + "...",
                "url": job.get("redirect_url", ""),
                "posted_date": job.get("created", "")[:10],
                "type": "Full-time",
                "source": "Adzuna"
            })

        return {
            "success": True,
            "location": location,
            "keywords": keywords,
            "total": len(jobs),
            "jobs": jobs
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Adzuna API error: {str(e)}"
        )
