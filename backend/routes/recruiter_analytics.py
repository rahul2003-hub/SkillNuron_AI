from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import Counter

from database import get_db
from models.user import User, ResumeAnalysis
from models.job import JobPosting
from models.application import JobApplication, STAGES
from deps import require_recruiter

router = APIRouter(prefix="/recruiter", tags=["Recruiter Analytics"])


# ---------------------------------
# Recruiter Dashboard Analytics
# ---------------------------------
@router.get("/analytics")
def recruiter_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    recruiter_jobs = []
    try:
        recruiter_jobs = db.query(JobPosting).filter(
            JobPosting.posted_by_id == current_user.id
        ).all()
        total_jobs = len(recruiter_jobs)
    except Exception:
        total_jobs = 0

    try:
        total_candidates = db.query(User).filter(
            User.user_type == "jobseeker"
        ).count()
    except Exception:
        total_candidates = 0

    try:
        skill_counter = Counter(
            skill
            for job in recruiter_jobs
            for skill in (job.required_skills or [])
        )
        top_skills = [
            {"skill": skill, "count": count}
            for skill, count in skill_counter.most_common(5)
        ]
    except Exception:
        top_skills = []

    try:
        scores = db.query(ResumeAnalysis.overall_score).all()
        valid_scores = [s[0] for s in scores if s and s[0] is not None]
        avg_resume_score = round(sum(valid_scores) / len(valid_scores), 2) if valid_scores else 0
    except Exception:
        avg_resume_score = 0
        valid_scores = []

    # Resume score distribution buckets: 0-40 / 40-60 / 60-80 / 80-100
    buckets = [{"range": "0-40", "count": 0}, {"range": "40-60", "count": 0},
               {"range": "60-80", "count": 0}, {"range": "80-100", "count": 0}]
    for s in valid_scores:
        if s < 40:
            buckets[0]["count"] += 1
        elif s < 60:
            buckets[1]["count"] += 1
        elif s < 80:
            buckets[2]["count"] += 1
        else:
            buckets[3]["count"] += 1

    try:
        skill_demand_counter = Counter(
            skill
            for job in recruiter_jobs
            for skill in (job.required_skills or [])
        )
        skill_demand = [
            {"skill": skill, "count": count}
            for skill, count in skill_demand_counter.most_common(8)
        ]
    except Exception:
        skill_demand = []

    funnel = [{"stage": stage, "count": 0} for stage in STAGES]
    if recruiter_jobs:
        counts = dict(
            db.query(JobApplication.status, func.count(JobApplication.id))
            .filter(JobApplication.job_id.in_([job.id for job in recruiter_jobs]))
            .group_by(JobApplication.status)
            .all()
        )
        funnel = [{"stage": stage, "count": counts.get(stage, 0)} for stage in STAGES]

    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "top_skills": top_skills,
        "average_resume_score": avg_resume_score,
        "skill_demand": skill_demand,
        "match_score_distribution": buckets,
        "application_funnel": funnel,
    }
