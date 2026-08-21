from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.match_services import match_candidates_for_job
from models.job import JobPosting
from models.user import User
from deps import require_recruiter

router = APIRouter(prefix="/recruiter", tags=["Recruiter"])


@router.get("/job/{job_id}/matches")
def get_candidate_matches(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    matches = match_candidates_for_job(db, job_id)

    return {
        "job_id": job_id,
        "matches": matches
    }

@router.get("/dashboard")
def recruiter_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    jobs = db.query(JobPosting).count()
    candidates = db.query(User).filter(User.user_type == "jobseeker").count()

    return {
        "total_jobs": jobs,
        "total_candidates": candidates
    }