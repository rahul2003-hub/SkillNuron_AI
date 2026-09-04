from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from models.application import JobApplication
from models.job import JobPosting
from models.skill import SKILL_SUGGESTIONS
from models.catalog import get_catalog, auto_categorize, get_bucket
from deps import get_current_user
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/profile", tags=["Profile"])


# --- Request Models ---

class SkillGapRequest(BaseModel):
    user_skills: list[str]
    target_role: str


class CareerPathRequest(BaseModel):
    user_skills: list[str]
    experience_years: int
    target_role: str


class SaveSkillsRequest(BaseModel):
    skills: list[dict]  # [{"skill_name": "Python", "level": "Advanced", "category": "Programming"}]


class SaveResumeAnalysisRequest(BaseModel):
    overall_score: int
    analysis_json: dict
    resume_path: str | None = None
    filename: str | None = None


class UpdateProfileRequest(BaseModel):
    education: str = ""
    education_status: str = ""
    graduation_year: str = ""
    current_status: str = ""
    target_roles: list[str] = []
    primary_role: str = ""
    location: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""

    @field_validator("target_roles")
    @classmethod
    def validate_target_roles(cls, roles: list[str]) -> list[str]:
        roles = list(dict.fromkeys(role.strip() for role in roles if role.strip()))
        if len(roles) > 3:
            raise ValueError("You can save up to 3 target roles")
        return roles


# --- Catalog Endpoint ---

@router.get("/catalog")
async def get_frontend_catalog():
    """Single source for all dropdown/select data used across the frontend
    (cities, roles, application statuses, education options, skill buckets).
    """
    return {"success": True, "catalog": get_catalog()}


# --- Profile Endpoints ---

@router.get("/info/{user_id}")
async def get_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full profile info for a user"""
    target_uuid = current_user.id if (not user_id or user_id == "me") else uuid.UUID(user_id)
    if target_uuid != current_user.id and current_user.user_type != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied: cannot view another user's profile")

    user = db.query(User).filter(User.id == target_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(
        UserProfile.user_id == target_uuid
    ).first()

    return {
        "success": True,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "user_type": user.user_type,
            "created_at": str(user.created_at)
        },
        "profile": {
            "education": profile.education if profile else "",
            "education_status": profile.education_status if profile else "",
            "graduation_year": profile.graduation_year if profile else "",
            "current_status": profile.current_status if profile else "",
            "target_roles": profile.target_roles if profile else [],
            "primary_role": profile.primary_role if profile else "",
            "location": profile.location if profile else "",
            "phone": profile.phone if profile else "",
            "linkedin": profile.linkedin if profile else "",
            "github": profile.github if profile else "",
        }
    }


@router.post("/info/update")
async def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update user profile info"""
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()

    if profile:
        profile.education = request.education
        profile.education_status = request.education_status
        profile.graduation_year = request.graduation_year
        profile.current_status = request.current_status
        profile.target_roles = request.target_roles
        profile.primary_role = request.primary_role
        profile.location = request.location
        profile.phone = request.phone
        profile.linkedin = request.linkedin
        profile.github = request.github
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = UserProfile(
            user_id=current_user.id,
            education=request.education,
            education_status=request.education_status,
            graduation_year=request.graduation_year,
            current_status=request.current_status,
            target_roles=request.target_roles,
            primary_role=request.primary_role,
            location=request.location,
            phone=request.phone,
            linkedin=request.linkedin,
            github=request.github
        )
        db.add(profile)

    db.commit()
    return {"success": True, "message": "Profile updated successfully"}


@router.get("/skill-suggestions")
async def get_skill_suggestions():
    """Return predefined skill suggestions for autocomplete"""
    return {"success": True, "suggestions": SKILL_SUGGESTIONS}


VALID_SKILL_LEVELS = {"Beginner", "Intermediate", "Advanced", "Expert"}


@router.post("/skills/save")
async def save_skills(
    request: SaveSkillsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save user skills — one unique skill with one proficiency per user.
    Category is auto-classified server-side when not explicitly provided.
    """
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()

    unique_skills = {}

    for skill_data in request.skills:

        skill_name = (
            skill_data.get("skill_name")
            or skill_data.get("name")
            or ""
        ).strip()

        if not skill_name:
            continue

        normalized_name = skill_name.lower()

        level = skill_data.get("level", "Intermediate")
        if level not in VALID_SKILL_LEVELS:
            level = "Intermediate"

        category = (skill_data.get("category") or "").strip()
        if not category:
            category = auto_categorize(skill_name, SKILL_SUGGESTIONS)

        if normalized_name in unique_skills:
            unique_skills[normalized_name]["level"] = level
        else:
            unique_skills[normalized_name] = {
                "skill_name": skill_name,
                "level": level,
                "category": category
            }

    for skill_data in unique_skills.values():
        skill = UserSkill(
            user_id=current_user.id,
            skill_name=skill_data["skill_name"],
            level=skill_data["level"],
            category=skill_data["category"]
        )
        db.add(skill)

    db.commit()

    return {
        "success": True,
        "message": f"{len(unique_skills)} skills saved successfully"
    }


@router.get("/skills/{user_id}")
async def get_skills(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get saved skills for a user, including bucket classification.
    Only the owning user or a recruiter may view another user's skills —
    "me"/empty resolves to the caller, anything else is checked strictly.
    """
    if not user_id or user_id == "me":
        target_uuid = current_user.id
    else:
        try:
            target_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")

        if target_uuid != current_user.id and current_user.user_type != "recruiter":
            raise HTTPException(status_code=403, detail="Access denied: cannot view another user's skills")

    skills = db.query(UserSkill).filter(UserSkill.user_id == target_uuid).all()

    return {
        "success": True,
        "user_id": str(target_uuid),
        "skills": [
            {
                "name": s.skill_name,
                "level": s.level,
                "category": s.category,
                "bucket": get_bucket(s.category)
            }
            for s in skills
        ]
    }


def calculate_top_recruiters_for_user(db: Session, user: User) -> list[dict]:
    """Calculate the top 5 matching recruiters/companies for a job seeker."""
    # 1. Gather job seeker profile context
    user_skills_rows = db.query(UserSkill.skill_name).filter(UserSkill.user_id == user.id).all()
    user_skills = [s[0].strip() for s in user_skills_rows if s and s[0]]

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    target_roles = []
    preferred_location = ""
    if profile:
        if profile.primary_role and profile.primary_role.strip():
            target_roles.append(profile.primary_role.strip())
        if profile.target_roles:
            target_roles.extend([r.strip() for r in profile.target_roles if r and r.strip() and r.strip() not in target_roles])
        preferred_location = (profile.location or "").strip().lower()
    target_roles_lower = [r.lower() for r in target_roles]

    # 2. Get all jobs
    jobs = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    if not jobs:
        return []

    # Group by company name
    companies_map: dict[str, dict] = {}
    for job in jobs:
        company_name = (job.company or job.posted_by or "Company").strip()
        if not company_name:
            company_name = "Company"

        if company_name not in companies_map:
            companies_map[company_name] = {
                "company": company_name,
                "recruiter_name": (job.posted_by or company_name).strip(),
                "jobs": [],
                "skills_set": set(),
                "locations": set(),
                "roles": [],
            }

        entry = companies_map[company_name]
        entry["jobs"].append(job)
        if job.title and job.title.strip() and job.title.strip() not in entry["roles"]:
            entry["roles"].append(job.title.strip())
        if job.location and job.location.strip():
            entry["locations"].add(job.location.strip())
        if job.required_skills:
            for s in job.required_skills:
                if s and s.strip():
                    entry["skills_set"].add(s.strip())

    # 3. Score each company/recruiter
    scored_recruiters = []
    for company_name, data in companies_map.items():
        company_jobs = data["jobs"]
        job_count = len(company_jobs)
        skills_set = data["skills_set"]

        # Skill matching
        matched_skills = [s for s in user_skills if s.lower() in {cs.lower() for cs in skills_set}]

        # Role matching
        role_matched = False
        if target_roles_lower:
            for role_name in data["roles"]:
                role_lower = role_name.lower()
                if any(tr in role_lower or role_lower in tr for tr in target_roles_lower):
                    role_matched = True
                    break

        # Location matching
        loc_matched = False
        if preferred_location:
            loc_matched = any(preferred_location in loc.lower() for loc in data["locations"])

        # Calculate a realistic percentage match score (50-98%)
        if user_skills or target_roles:
            skill_ratio = len(matched_skills) / max(len(user_skills), 1) if user_skills else 0.4
            role_bonus = 25 if role_matched else 5
            skill_score = skill_ratio * 45
            loc_bonus = 10 if loc_matched else 0
            base_score = int(round(45 + skill_score + role_bonus + loc_bonus))
            match_score = max(55, min(98, base_score))
        else:
            # New user with no profile yet: rank by activity
            match_score = min(85, 65 + min(job_count * 5, 20))

        scored_recruiters.append({
            "company": company_name,
            "recruiter_name": data["recruiter_name"],
            "active_jobs_count": job_count,
            "match_score": match_score,
            "top_roles": data["roles"][:3],
            "locations": list(data["locations"])[:2],
            "matching_skills": matched_skills[:5] if matched_skills else list(skills_set)[:3],
            "_sort_key": (match_score, len(matched_skills), job_count)
        })

    # Sort descending by match score and active jobs
    scored_recruiters.sort(key=lambda x: x["_sort_key"], reverse=True)

    # Take Top 5
    top_5 = scored_recruiters[:5]
    for item in top_5:
        item.pop("_sort_key", None)

    return top_5


# --- Dashboard Endpoint ---

@router.get("/dashboard")
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """One-call summary for the jobseeker home screen: skill count, latest
    resume score, application count, profile completeness %, and top 5 recruiters.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    skills_count = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).count()

    latest_analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .first()
    )
    latest_resume_score = latest_analysis.overall_score if latest_analysis else None
    has_resume = latest_analysis is not None

    applications_count = (
        db.query(JobApplication)
        .filter(JobApplication.candidate_id == current_user.id)
        .count()
    )

    completeness = 0
    if skills_count > 0:
        completeness += 25
    if profile and profile.primary_role:
        completeness += 25
    if profile and profile.education and profile.current_status:
        completeness += 25
    if has_resume:
        completeness += 25

    top_recruiters = calculate_top_recruiters_for_user(db, current_user)

    return {
        "success": True,
        "skills_count": skills_count,
        "latest_resume_score": latest_resume_score,
        "applications_count": applications_count,
        "profile_completeness": completeness,
        "top_recruiters": top_recruiters
    }


# --- Resume Analysis Save ---

@router.post("/resume/save")
async def save_resume_analysis(
    request: SaveResumeAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save resume analysis result for authenticated user"""
    analysis = ResumeAnalysis(
        user_id=current_user.id,
        overall_score=request.overall_score,
        analysis_json=request.analysis_json,
        resume_path=request.resume_path,
        filename=request.filename
    )

    db.add(analysis)
    db.commit()

    return {"success": True, "message": "Resume analysis saved"}


@router.get("/resume/history/{user_id}")
async def get_resume_history(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all past resume analyses for a user"""
    target_uuid = current_user.id if (not user_id or user_id == "me") else uuid.UUID(user_id)
    if target_uuid != current_user.id and current_user.user_type != "recruiter":
        raise HTTPException(status_code=403, detail="Access denied: cannot view another user's resume history")

    analyses = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == target_uuid
    ).order_by(ResumeAnalysis.created_at.desc()).all()

    return {
        "success": True,
        "total": len(analyses),
        "analyses": [
            {
                "id": str(a.id),
                "overall_score": a.overall_score,
                "created_at": str(a.created_at),
                "analysis": a.analysis_json,
                "resume_path": a.resume_path,
                "filename": a.filename
            }
            for a in analyses
        ]
    }


# --- AI Endpoints ---

@router.post("/skill-gap")
async def get_skill_gap(
    request: SkillGapRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze skill gap between user skills and target role"""
    from services.ai_service import analyze_skill_gap

    if not request.user_skills:
        raise HTTPException(status_code=400, detail="Please provide at least one skill")

    if not request.target_role:
        raise HTTPException(status_code=400, detail="Please provide a target role")

    try:
        result = analyze_skill_gap(
            user_skills=request.user_skills,
            target_role=request.target_role
        )
        return {
            "success": True,
            "target_role": request.target_role,
            "user_skills": request.user_skills,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {str(e)}")


@router.post("/career-path")
async def get_career_path(
    request: CareerPathRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered career path recommendations"""
    from services.ai_service import recommend_career_path

    if not request.user_skills:
        raise HTTPException(status_code=400, detail="Please provide at least one skill")

    try:
        result = recommend_career_path(
            user_skills=request.user_skills,
            experience_years=request.experience_years,
            target_role=request.target_role
        )
        return {
            "success": True,
            "target_role": request.target_role,
            "recommendation": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Career path recommendation failed: {str(e)}")
