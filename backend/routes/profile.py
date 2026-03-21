from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserSkill, ResumeAnalysis
from services.ai_service import analyze_skill_gap, recommend_career_path
import uuid

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
    user_id: str
    skills: list[dict]  # [{"skill_name": "Python", "level": 80, "category": "Programming"}]


class SaveResumeAnalysisRequest(BaseModel):
    user_id: str
    overall_score: int
    analysis_json: dict


# --- Skills Endpoints ---

@router.post("/skills/save")
async def save_skills(request: SaveSkillsRequest, db: Session = Depends(get_db)):
    """Save user skills to PostgreSQL — replaces all existing skills"""

    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete old skills and replace with new ones
    db.query(UserSkill).filter(UserSkill.user_id == request.user_id).delete()

    for skill_data in request.skills:
        skill = UserSkill(
            user_id=uuid.UUID(request.user_id),
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
async def get_skills(user_id: str, db: Session = Depends(get_db)):
    """Get saved skills for a user from PostgreSQL"""

    skills = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()

    return {
        "success": True,
        "user_id": user_id,
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
async def save_resume_analysis(request: SaveResumeAnalysisRequest, db: Session = Depends(get_db)):
    """Save resume analysis result to PostgreSQL"""

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    analysis = ResumeAnalysis(
        user_id=uuid.UUID(request.user_id),
        overall_score=request.overall_score,
        analysis_json=request.analysis_json
    )

    db.add(analysis)
    db.commit()

    return {"success": True, "message": "Resume analysis saved"}


@router.get("/resume/history/{user_id}")
async def get_resume_history(user_id: str, db: Session = Depends(get_db)):
    """Get all past resume analyses for a user"""

    analyses = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == user_id
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
async def get_skill_gap(request: SkillGapRequest):
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
async def get_career_path(request: CareerPathRequest):
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