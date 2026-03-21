from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import analyze_skill_gap, recommend_career_path

router = APIRouter(prefix="/api/profile", tags=["Profile"])


# --- Request Models ---

class SkillGapRequest(BaseModel):
    user_skills: list[str]
    target_role: str


class CareerPathRequest(BaseModel):
    user_skills: list[str]
    experience_years: int
    target_role: str


# --- Endpoints ---

@router.post("/skill-gap")
async def get_skill_gap(request: SkillGapRequest):
    """Analyze skill gap between user skills and target role"""

    if not request.user_skills:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one skill"
        )

    if not request.target_role:
        raise HTTPException(
            status_code=400,
            detail="Please provide a target role"
        )

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
        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {str(e)}"
        )


@router.post("/career-path")
async def get_career_path(request: CareerPathRequest):
    """Get AI-powered career path recommendations"""

    if not request.user_skills:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one skill"
        )

    if not request.target_role:
        raise HTTPException(
            status_code=400,
            detail="Please provide a target role"
        )

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
        raise HTTPException(
            status_code=500,
            detail=f"Career path recommendation failed: {str(e)}"
        )