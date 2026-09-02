from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.job import JobPosting
from models.user import User, UserSkill, UserProfile
from models.application import JobApplication
from deps import get_current_user, require_recruiter
from services.ai_service import match_jobs_to_candidate, polish_job_description, recommend_skills_for_role
import uuid
import os
import httpx
import re

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


class RoleSkillsRequest(BaseModel):
    title: str


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


@router.post("/recommend-skills")
async def recommend_skills(
    request: RoleSkillsRequest,
    current_user: User = Depends(require_recruiter)
):
    """AI-powered skill recommendations for a job role"""
    if not request.title.strip():
        return {"success": True, "skills": []}

    try:
        skills = recommend_skills_for_role(request.title.strip())
        return {"success": True, "skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill recommendation failed: {str(e)}")


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

JOB_TYPES = ["Full-time", "Part-time", "Internship"]


def _external_job_type(job: dict) -> str:
    """Map Adzuna's contract fields into the job types exposed by the UI."""
    text = " ".join([
        str(job.get("title", "")),
        str(job.get("description", "")),
    ]).lower()
    if "intern" in text:
        return "Internship"

    contract_type = str(job.get("contract_type", "")).replace("-", "_").lower()
    if contract_type == "part_time":
        return "Part-time"

    return "Full-time"


async def _fetch_external_jobs(
    keywords: str = "",
    location: str = "",
    results: int = 50,
) -> list[dict]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": results,
        "content-type": "application/json",
    }
    if keywords.strip():
        params["what"] = keywords.strip()
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
            "type": _external_job_type(job), "requiredSkills": [],
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
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    results: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return one normalized and filtered SkillNuron + external jobs feed with 12 items per page."""
    source = source.strip().lower()
    if source not in {"all", "internal", "external"}:
        raise HTTPException(status_code=400, detail="Invalid job source")

    normalized_types = {job_type.lower(): job_type for job_type in JOB_TYPES}
    selected_job_type = normalized_types.get(job_type.strip().lower())
    if job_type.strip() and not selected_job_type:
        raise HTTPException(status_code=400, detail="Invalid job type")

    status = status.strip().lower()
    if status not in {"", "applied", "not-applied"}:
        raise HTTPException(status_code=400, detail="Invalid application status")

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
            external_keywords = " ".join(
                value.strip() for value in (search, technology) if value.strip()
            )
            external_jobs = await _fetch_external_jobs(external_keywords, location, results)
        except (httpx.HTTPError, ValueError):
            pass

    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    target_roles = []
    preferred_location = ""
    if user_profile:
        if user_profile.primary_role:
            target_roles.append(user_profile.primary_role)
        if user_profile.target_roles:
            target_roles.extend([r for r in user_profile.target_roles if r and r not in target_roles])
        preferred_location = user_profile.location or ""

    profile_skills = [
        name for (name,) in db.query(UserSkill.skill_name)
        .filter(UserSkill.user_id == current_user.id).all()
    ]
    all_jobs = internal_jobs + external_jobs
    lower = lambda value: value.strip().lower()

    def _salary_score(salary: str) -> int:
        """Return the highest stated annual salary, or zero when unavailable."""
        salary_text = lower(salary)
        values = [float(value.replace(",", "")) for value in re.findall(
            r"\d[\d,]*(?:\.\d+)?", salary_text
        )]
        if not values:
            return 0

        highest = max(values)
        if "lpa" in salary_text or "lakh" in salary_text:
            highest *= 100_000
        return int(highest)

    def calculate_score(job: dict) -> tuple[int, int, int, int, int]:
        """Rank jobs in the requested priority order, without lower priorities overtaking higher ones."""
        job_title = lower(job.get("title", ""))
        job_desc = lower(job.get("description", ""))
        job_loc = lower(job.get("location", ""))
        job_skills = [lower(s) for s in job.get("requiredSkills", [])]

        role_score = 0
        for role in target_roles:
            normalized_role = lower(role)
            role_words = [word for word in normalized_role.split() if len(word) > 2]
            if normalized_role and normalized_role in job_title:
                role_score = max(role_score, 3)
            elif role_words and any(word in job_title for word in role_words):
                role_score = max(role_score, 2)

        profile_skill_score = sum(
            1 for skill in profile_skills
            if (normalized_skill := lower(skill)) and normalized_skill in job_skills
        )
        jd_score = sum(
            1 for skill in profile_skills
            if (normalized_skill := lower(skill)) and normalized_skill in job_desc
        )
        jd_score += sum(
            1 for role in target_roles
            if (normalized_role := lower(role)) and normalized_role in job_desc
        )

        location_score = 2 if preferred_location and lower(preferred_location) in job_loc else 0
        if not location_score and "remote" in job_loc:
            location_score = 1

        return (
            role_score,
            profile_skill_score,
            jd_score,
            location_score,
            _salary_score(job.get("salary", "")),
        )

    def _posted_date_score(job: dict) -> int:
        date_match = re.search(r"\d{4}-\d{2}-\d{2}", job.get("postedLabel", ""))
        return int(date_match.group().replace("-", "")) if date_match else 0

    def sort_key(job: dict) -> tuple[int, int, int, int, int, int, str, str, str]:
        """Use recency and job details only to break an otherwise equal recommendation score."""
        return (
            *calculate_score(job),
            _posted_date_score(job),
            lower(job.get("title", "")),
            lower(job.get("company", "")),
            str(job.get("id", "")),
        )

    def filtered_sort_key(job: dict) -> tuple[int, str, str, str]:
        """Keep filtered/search results neutral: newest jobs first, never by source."""
        return (
            _posted_date_score(job),
            lower(job.get("title", "")),
            lower(job.get("company", "")),
            str(job.get("id", "")),
        )

    def matches(job: dict) -> bool:
        text = lower(" ".join([job["title"], job["company"], job["description"], *job["requiredSkills"]]))
        search_terms = lower(search).split()
        return (
            (not search_terms or all(term in text for term in search_terms))
            and (not technology or lower(technology) in text)
            and (not location or lower(location) in lower(job["location"]))
            and (not company or lower(company) in lower(job["company"]))
            and (not selected_job_type or selected_job_type == job.get("type"))
            and (not status or (status == "applied") == job["applied"])
            and (not match_profile or any(lower(skill) in text for skill in profile_skills))
        )

    matched_jobs = [job for job in all_jobs if matches(job)]
    has_active_filter = any([
        source != "all",
        bool(search.strip()),
        bool(technology.strip()),
        bool(selected_job_type),
        bool(location.strip()),
        bool(company.strip()),
        bool(status),
        match_profile,
    ])
    matched_jobs.sort(
        key=filtered_sort_key if has_active_filter else sort_key,
        reverse=True,
    )
    total_count = len(matched_jobs)
    total_pages = max(1, (total_count + limit - 1) // limit)
    start_idx = max(0, (page - 1) * limit)
    paginated_jobs = matched_jobs[start_idx : start_idx + limit]

    def _build_page_numbers(p: int, tp: int) -> list[int | str]:
        if tp <= 5:
            return list(range(1, tp + 1))
        if p <= 2:
            return [1, 2, "...", tp]
        if p >= tp - 1:
            return [1, "...", tp - 1, tp]
        return [1, "...", p, "...", tp]

    return {
        "success": True,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "page_numbers": _build_page_numbers(page, total_pages),
        "jobs": paginated_jobs,
        "options": {
            "types": JOB_TYPES,
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
