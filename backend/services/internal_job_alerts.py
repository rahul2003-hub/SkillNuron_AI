"""Background delivery of alerts for newly posted internal jobs."""

import logging

from database import SessionLocal
from models.application import JobApplication, Notification
from models.job import JobPosting
from models.job_alert import JobAlertPreference
from models.user import User, UserProfile, UserSkill
from services.candidate_communications import send_new_job_match_email
from services.match_services import calculate_match_score, evaluate_location_fit


logger = logging.getLogger(__name__)
MATCH_THRESHOLD = 70


def alert_candidates_for_new_job(job_id, threshold: int = MATCH_THRESHOLD) -> None:
    """Score every opted-in candidate and notify matches without blocking a post.

    A fresh session is required because this function is run by FastAPI after
    the request-scoped session has been closed.
    """
    db = SessionLocal()
    try:
        job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
        if not job:
            return

        preferences = db.query(JobAlertPreference).filter(JobAlertPreference.enabled.is_(True)).all()
        matched_candidates = []
        for preference in preferences:
            candidate = db.query(User).filter(
                User.id == preference.user_id, User.user_type == "jobseeker"
            ).first()
            if not candidate:
                continue
            # A candidate cannot meaningfully receive a new-job alert for a job
            # they have already applied to.
            if db.query(JobApplication.id).filter(
                JobApplication.job_id == job.id, JobApplication.candidate_id == candidate.id
            ).first():
                continue

            profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
            skills = [skill_name for (skill_name,) in db.query(UserSkill.skill_name).filter(
                UserSkill.user_id == candidate.id
            ).all()]
            skill_score = calculate_match_score(job.required_skills or [], skills)
            location_fit = evaluate_location_fit(job.location, job.type, profile.location if profile else None)
            score = int(round(skill_score * location_fit["multiplier"]))
            if score < threshold:
                continue

            db.add(Notification(
                user_id=candidate.id,
                message=f"New job matches your profile: '{job.title}' at {job.company} ({score}% match).",
            ))
            matched_candidates.append((candidate, score))

        db.commit()
        for candidate, score in matched_candidates:
            if candidate.email:
                send_new_job_match_email(
                    candidate_email=candidate.email,
                    candidate_name=candidate.name or "",
                    job_title=job.title,
                    company=job.company,
                    match_score=score,
                )
        logger.info("Delivered %s new-job alerts for job %s", len(matched_candidates), job_id)
    except Exception:
        db.rollback()
        logger.exception("New-job alert delivery failed for job %s", job_id)
    finally:
        db.close()
