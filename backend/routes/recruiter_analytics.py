from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

from database import get_db
from models.user import User, UserSkill, ResumeAnalysis
from models.job import JobPosting

router = APIRouter(prefix="/recruiter", tags=["Recruiter Analytics"])


# ---------------------------------
# Recruiter Dashboard Analytics
# ---------------------------------
@router.get("/analytics")
def recruiter_analytics(db: Session = Depends(get_db)):

    # total jobs
    total_jobs = db.query(JobPosting).count()

    # total candidates
    # FIXED: Uses user_type and "jobseeker"
    total_candidates = db.query(User).filter(
        User.user_type == "jobseeker"
    ).count()

    # collect all candidate skills
    skills = db.query(UserSkill).all()
    skill_list = [s.skill_name for s in skills]

    skill_counter = Counter(skill_list)

    # top 5 skills
    top_skills = [
        {"skill": skill, "count": count}
        for skill, count in skill_counter.most_common(5)
    ]

    # resume score analytics
    # FIXED: Uses overall_score instead of score
    scores = db.query(ResumeAnalysis.overall_score).all()
    scores = [s[0] for s in scores if s[0] is not None]

    avg_resume_score = None
    if scores:
        avg_resume_score = round(sum(scores) / len(scores), 2)

    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "top_skills": top_skills,
        "average_resume_score": avg_resume_score
    }