from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from services.ai_service import analyze_skill_gap, recommend_career_path
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
    skills: list[dict]  # [{"skill_name": "Python", "level": 80, "category": "Programming"}]


class SaveResumeAnalysisRequest(BaseModel):
    overall_score: int
    analysis_json: dict

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

# --- Profile Endpoints ---

@router.get("/info/{user_id}")
async def get_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full profile info for a user"""
    # Allow user to view their own profile or recruiter viewing candidates
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
            "target_roles": profile.target_roles if profile else [], # Changed this
            "primary_role": profile.primary_role if profile else "",  # Added this
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
        profile.target_roles = request.target_roles      # Changed this
        profile.primary_role = request.primary_role      # Added this
        profile.location = request.location
        profile.phone = request.phone
        profile.linkedin = request.linkedin
        profile.github = request.github
        profile.updated_at = datetime.now(timezone.utc)
    else:
        # Create new profile
        profile = UserProfile(
            user_id=current_user.id,
            education=request.education,
            education_status=request.education_status,
            graduation_year=request.graduation_year,
            current_status=request.current_status,
            target_roles=request.target_roles,           # Changed this
            primary_role=request.primary_role,           # Added this
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
    from models.skill import SKILL_SUGGESTIONS
    return {"success": True, "suggestions": SKILL_SUGGESTIONS}

@router.post("/skills/save")
async def save_skills(
    request: SaveSkillsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save user skills to PostgreSQL — replaces all existing skills for authenticated user"""
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()

    for skill_data in request.skills:
        skill = UserSkill(
            user_id=current_user.id,
            skill_name=skill_data.get("skill_name") or skill_data.get("name", ""),
            level=skill_data.get("level", 50),
            category=skill_data.get("category", "Programming")
        )
        db.add(skill)

    db.commit()

    return {
        "success": True,
        "message": f"{len(request.skills)} skills saved successfully"
    }


@router.get("/skills/{user_id}")
async def get_skills(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get saved skills for a user from PostgreSQL"""
    target_uuid = current_user.id if (not user_id or user_id == "me") else uuid.UUID(user_id)
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
                "category": s.category
            }
            for s in skills
        ]
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
        analysis_json=request.analysis_json
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
                "analysis": a.analysis_json
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