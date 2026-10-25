from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from database import get_db
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from deps import require_recruiter
from services.storage_service import get_resume_signed_url

router = APIRouter(prefix="/recruiter", tags=["Talent Pool"])

# -------------------------------
# Get All Candidates (Talent Pool)
# -------------------------------
@router.get("/candidates")
def get_candidates(
    skill: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    min_experience: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    query = db.query(User).filter(User.user_type == "jobseeker")
    candidates = query.all()

    results = []

    for candidate in candidates:
        profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
        skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
        resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == candidate.id).first()

        skill_list = [s.skill_name for s in skills]

        searchable_text = " ".join([candidate.name or "", candidate.email or "", *skill_list]).lower()

        if skill and skill.lower() not in [s.lower() for s in skill_list]:
            continue
        if search and search.strip().lower() not in searchable_text:
            continue
        candidate_location = profile.location if profile else ""
        if location and location.strip().lower() not in (candidate_location or "").lower():
            continue
        if (profile.experience_years if profile else 0) < min_experience:
            continue

        results.append({
            "candidate_id": str(candidate.id), # Safely cast to string
            "email": candidate.email,
            "name": candidate.name, # FIXED: Name is on User model
            "location": profile.location if profile else None,
            "skills": skill_list,
            "resume_score": resume.overall_score if resume else None,
            "experience_years": profile.experience_years if profile else 0,
            "education": profile.education if profile else None,
            "primary_role": profile.primary_role if profile else None,
            "resume_filename": resume.filename if resume else None,
            "has_resume": bool(resume and resume.resume_path),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
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
            "education": profile.education if profile else None,
            "experience_years": profile.experience_years if profile else 0,
            "primary_role": profile.primary_role if profile else None,
        },
        "skills": [s.skill_name for s in skills],
        "resume_analysis": resume.analysis_json if resume else None,
        "resume_score": resume.overall_score if resume else None,
        "resume_filename": resume.filename if resume else None,
        "has_resume": bool(resume and resume.resume_path),
    }


@router.get("/candidate/{candidate_id}/resume")
async def get_candidate_resume(
    candidate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    try:
        valid_uuid = uuid.UUID(candidate_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format") from exc

    resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == valid_uuid).first()
    if not resume or not resume.resume_path:
        raise HTTPException(status_code=404, detail="No resume available for this candidate")

    return {"success": True, "url": await get_resume_signed_url(resume.resume_path)}
