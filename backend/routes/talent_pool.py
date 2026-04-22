from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from database import get_db
from models.user import User, UserProfile, UserSkill, ResumeAnalysis

router = APIRouter(prefix="/recruiter", tags=["Talent Pool"])

# -------------------------------
# Get All Candidates (Talent Pool)
# -------------------------------
@router.get("/candidates")
def get_candidates(
    skill: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # FIXED: Uses user_type and "jobseeker" instead of role
    query = db.query(User).filter(User.user_type == "jobseeker")
    candidates = query.all()

    results = []

    for candidate in candidates:
        profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
        skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
        resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == candidate.id).first()

        skill_list = [s.skill_name for s in skills]

        # Skill filtering
        if skill:
            if skill.lower() not in [s.lower() for s in skill_list]:
                continue

        results.append({
            "candidate_id": str(candidate.id), # Safely cast to string
            "email": candidate.email,
            "name": candidate.name, # FIXED: Name is on User model
            "location": profile.location if profile else None,
            "skills": skill_list,
            "resume_score": resume.overall_score if resume else None # FIXED: overall_score
        })

    return {
        "total_candidates": len(results),
        "candidates": results
    }


# ---------------------------------
# Get Single Candidate Profile
# ---------------------------------
@router.get("/candidate/{candidate_id}")
def get_candidate_profile(
    candidate_id: str,
    db: Session = Depends(get_db)
):
    # FIXED: Added UUID validation to prevent DB crashes
    try:
        valid_uuid = uuid.UUID(candidate_id)
    except ValueError:
        return {"error": "Invalid candidate ID format"}

    candidate = db.query(User).filter(User.id == valid_uuid).first()

    if not candidate:
        return {"error": "Candidate not found"}

    profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
    skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
    resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == candidate.id).first()

    return {
        "candidate_id": str(candidate.id),
        "email": candidate.email,
        "profile": {
            "name": candidate.name, # FIXED: Name is on User model
            "location": profile.location if profile else None,
            "education": profile.education if profile else None # Replaced 'bio' with 'education' which exists
        },
        "skills": [s.skill_name for s in skills],
        "resume_analysis": resume.analysis_json if resume else None # FIXED: analysis_json
    }