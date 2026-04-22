from sqlalchemy.orm import Session
from models.user import User, UserSkill, UserProfile, ResumeAnalysis
from models.job import JobPosting
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
from uuid import UUID
from services.ai_service import ai_candidate_match 

def calculate_match_score(job_skills, candidate_skills):
    if not job_skills or not candidate_skills:
        return 0.0

    job_vec = Counter(job_skills)
    cand_vec = Counter(candidate_skills)

    all_skills = list(set(job_skills + candidate_skills))

    job_vector = [job_vec.get(skill, 0) for skill in all_skills]
    cand_vector = [cand_vec.get(skill, 0) for skill in all_skills]

    score = cosine_similarity([job_vector], [cand_vector])[0][0]

    return round(score * 100, 2)


def match_candidates_for_job(db: Session, job_id: str):
    # 1. Safety Check UUID
    try:
        valid_uuid = UUID(job_id)
    except ValueError:
        return []

    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()

    if not job:
        return []

    job_skills = job.required_skills if job.required_skills else []
    candidates = db.query(User).filter(User.user_type == "jobseeker").all()

    # --- STAGE 1: FAST FILTERING (Cosine Similarity) ---
    initial_results = []

    for candidate in candidates:
        skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
        candidate_skills = [s.skill_name for s in skills]

        fast_score = calculate_match_score(job_skills, candidate_skills)

        initial_results.append({
            "candidate": candidate,
            "skills": candidate_skills,
            "fast_score": fast_score
        })

    # Sort by fast score and take ONLY Top 10 to save API costs & Time
    initial_results.sort(key=lambda x: x["fast_score"], reverse=True)
    top_candidates = initial_results[:10]

    # --- STAGE 2: DEEP AI EVALUATION & UI DATA GATHERING ---
    final_results = []

    for item in top_candidates:
        candidate = item["candidate"]
        cand_skills = item["skills"]

        # Fetch extra data for the Dashboard UI
        profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
        resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == candidate.id).first()

        try:
            # Call the LLM for deep reasoning
            ai_eval = ai_candidate_match(job_skills, cand_skills)
            final_score = ai_eval.get("match_score", item["fast_score"])
        except Exception as e:
            print(f"LLM Match Failed for {candidate.email}: {e}")
            # Safe Fallback
            ai_eval = {
                "match_score": item["fast_score"],
                "reason": "AI evaluation temporarily unavailable. Score based on keyword matching.",
                "missing_skills": []
            }
            final_score = item["fast_score"]

        final_results.append({
            "candidate_id": str(candidate.id),
            "name": candidate.name, # Grab their real name directly from User model
            "email": candidate.email,
            "location": profile.location if profile else None,
            "resume_score": resume.overall_score if resume else None, # Fixed field name
            "match_score": final_score, 
            "skills": cand_skills,
            "ai_evaluation": ai_eval
        })

    # Final sort based on the intelligent LLM score
    final_results.sort(key=lambda x: x["match_score"], reverse=True)

    return final_results