from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.job import JobPosting
from models.user import User, UserSkill
from models.application import JobApplication
from deps import get_current_user, require_recruiter
from services.ai_service import match_jobs_to_candidate, polish_job_description
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


class JDPolishRequest(BaseModel):
    title: str = ""
    description: str
    required_skills: list[str] = []


def _serialize_job(j: JobPosting) -> dict:
    return {
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


# --- Endpoints ---

@router.get("/")
async def get_all_jobs(db: Session = Depends(get_db)):
    """Get all job postings from PostgreSQL"""
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    return {
        "success": True,
        "total": len(jobs),
        "jobs": [_serialize_job(j) for j in jobs]
    }


@router.get("/mine")
async def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    """Jobs posted by the current recruiter — filtered server-side by stable
    user id (posted_by_id), not by display name.
    """
    jobs = (
        db.query(JobPosting)
        .filter(JobPosting.posted_by_id == current_user.id)
        .order_by(JobPosting.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "total": len(jobs),
        "jobs": [_serialize_job(j) for j in jobs]
    }


@router.post("/")
async def create_job(
    job: JobPostingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
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
        posted_by=job.posted_by,
        posted_by_id=current_user.id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "success": True,
        "message": "Job posted successfully",
        "job": _serialize_job(new_job)
    }


@router.post("/polish-description")
async def polish_description(
    request: JDPolishRequest,
    current_user: User = Depends(require_recruiter)
):
    """AI-polish a job description draft"""
    if not request.description or not request.description.strip():
        raise HTTPException(status_code=400, detail="Please provide a description to polish")

    try:
        result = polish_job_description(
            description=request.description,
            title=request.title,
            required_skills=request.required_skills
        )
        return {"success": True, "polished_description": result.get("polished_description", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD polishing failed: {str(e)}")


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    """Delete a job posting from PostgreSQL"""
    try:
        valid_job_id = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job_id format")

    job = db.query(JobPosting).filter(JobPosting.id == valid_job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.posted_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own job postings")

    db.delete(job)
    db.commit()

    return {"success": True, "message": "Job deleted successfully"}


@router.post("/match")
async def match_jobs(
    request: JobMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

CITY_MAP = {
    "Mumbai": "mumbai", "Pune": "pune", "Bangalore": "bangalore",
    "Hyderabad": "hyderabad", "Delhi": "delhi", "Noida": "noida",
    "Chennai": "chennai", "Navi Mumbai": "navi-mumbai",
    "Kolkata": "kolkata", "Ahmedabad": "ahmedabad"
}


async def _fetch_external_jobs(
    technology: str = "",
    location: str = "",
    results: int = 10,
) -> list[dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": results,
        "content-type": "application/json",
    }
    if technology.strip():
        params["what"] = technology.strip()
    if location.strip():
        params["where"] = CITY_MAP.get(location, location.lower())

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://api.adzuna.com/v1/api/jobs/in/search/1",
            params=params,
        )
        response.raise_for_status()
        data = response.json()

    jobs = []
    for job in data.get("results", []):
        salary_min = job.get("salary_min")
        salary_max = job.get("salary_max")
        salary = (
            f"₹{int(salary_min):,} - ₹{int(salary_max):,} per annum"
            if salary_min and salary_max else "Salary not disclosed"
        )
        jobs.append({
            "id": str(job.get("id", "")),
            "title": job.get("title", ""),
            "company": job.get("company", {}).get("display_name", "Company"),
            "location": job.get("location", {}).get("display_name", location),
            "salary": salary,
            "description": job.get("description", "")[:300] + "...",
            "type": "Full-time", "requiredSkills": [],
            "postedLabel": job.get("created", "")[:10],
            "source": "external", "sourceLabel": "External",
            "url": job.get("redirect_url", ""), "applied": False,
        })
    return jobs


@router.get("/recommendations")
async def get_job_recommendations(
    source: str = "all",
    search: str = "",
    technology: str = "",
    job_type: str = "",
    location: str = "",
    company: str = "",
    status: str = "",
    match_profile: bool = False,
    results: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return one normalized and filtered SkillNuron + external jobs feed."""
    if source not in {"all", "internal", "external"}:
        raise HTTPException(status_code=400, detail="Invalid job source")

    applied_ids = {
        str(job_id) for (job_id,) in db.query(JobApplication.job_id)
        .filter(JobApplication.candidate_id == current_user.id).all()
    }
    internal_jobs = []
    if source != "external":
        internal_jobs = [{
            "id": str(job.id), "title": job.title, "company": job.company,
            "location": job.location or "Remote", "salary": job.salary or "Not specified",
            "description": job.description or "", "type": job.type or "",
            "requiredSkills": job.required_skills or [],
            "postedLabel": str(job.created_at.date()) if job.created_at else "",
            "source": "internal", "sourceLabel": "SkillNuron", "url": None,
            "applied": str(job.id) in applied_ids,
        } for job in db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()]

    external_jobs = []
    if source != "internal":
        try:
            external_jobs = await _fetch_external_jobs(technology, location, results)
        except (httpx.HTTPError, ValueError):
            pass

    profile_skills = [
        name for (name,) in db.query(UserSkill.skill_name)
        .filter(UserSkill.user_id == current_user.id).all()
    ]
    all_jobs = internal_jobs + external_jobs
    lower = lambda value: value.strip().lower()

    def matches(job: dict) -> bool:
        text = lower(" ".join([job["title"], job["company"], job["description"], *job["requiredSkills"]]))
        return (
            (not search or lower(search) in text)
            and (not technology or lower(technology) in text)
            and (not location or lower(location) in lower(job["location"]))
            and (not company or lower(company) in lower(job["company"]))
            and (not job_type or lower(job_type) == lower(job["type"]))
            and (not status or (status == "applied") == job["applied"])
            and (not match_profile or any(lower(skill) in text for skill in profile_skills))
        )

    unique = lambda values: sorted({value for value in values if value}, key=str.lower)
    return {
        "success": True, "total": len(all_jobs),
        "jobs": [job for job in all_jobs if matches(job)],
        "options": {
            "types": unique([job["type"] for job in all_jobs]),
            "canMatchProfile": bool(profile_skills),
        },
    }


@router.get("/search")
async def search_jobs_adzuna(
    keywords: str = "",
    location: str = "",
    results: int = 10
):
    """Search real Indian jobs from Adzuna API"""

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

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": results,
        "content-type": "application/json",
    }
    if keywords.strip():
        params["what"] = keywords.strip()
    if location.strip():
        params["where"] = city_map.get(location, location.lower())

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.adzuna.com/v1/api/jobs/in/search/1",
                params=params,
            )
            data = response.json()

        if "results" not in data:
            return {
                "success": False,
                "message": "No results from Adzuna",
                "jobs": []
            }

        jobs = []
        for job in data["results"]:
            salary_min = job.get("salary_min")
            salary_max = job.get("salary_max")

            if salary_min and salary_max:
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
