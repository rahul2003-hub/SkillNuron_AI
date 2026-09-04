from sqlalchemy.orm import Session
from models.user import User, UserSkill, UserProfile, ResumeAnalysis
from models.job import JobPosting
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
from uuid import UUID
from services.ai_service import ai_candidate_match 

_AI_MATCH_CACHE = {}

def get_cached_ai_match(job_skills: list, candidate_skills: list) -> dict:
    key = (tuple(sorted(job_skills or [])), tuple(sorted(candidate_skills or [])))
    if key not in _AI_MATCH_CACHE:
        _AI_MATCH_CACHE[key] = ai_candidate_match(job_skills, candidate_skills)
    return _AI_MATCH_CACHE[key]


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


def evaluate_location_fit(job_location: str | None, job_type: str | None, candidate_location: str | None) -> dict:
    """
    Evaluates post-wise location compatibility for Indian tech hiring.
    
    Rules:
    1. If job is Remote (location or type contains 'remote'):
       - Location weighting drops to 0, 100% priority to skills fit.
    2. If job is On-site / In-Office:
       - Exact City match (e.g. Pune -> Pune): multiplier = 1.0 (Local priority)
       - Nearby / Commutable cluster (e.g. Mumbai <-> Pune, Delhi <-> Noida/Gurgaon): multiplier = 0.90
       - Far away (e.g. candidate in Delhi for Pune job): multiplier = 0.70 with relocation warning badge.
    """
    job_loc = (job_location or "").strip().lower()
    job_t = (job_type or "").strip().lower()
    cand_loc = (candidate_location or "").strip()
    cand_loc_lower = cand_loc.lower()

    # Rule 1: Remote job -> 100% skills priority, 0 location penalty
    if "remote" in job_loc or "remote" in job_t:
        return {
            "multiplier": 1.0,
            "status": "remote",
            "label": "Remote Eligible",
            "is_relocation_needed": False
        }

    # Candidate has no location in profile
    if not cand_loc:
        return {
            "multiplier": 0.85,
            "status": "unknown",
            "label": "Location Not Specified",
            "is_relocation_needed": False
        }

    # Job has no location set
    if not job_loc:
        return {
            "multiplier": 1.0,
            "status": "unknown",
            "label": cand_loc,
            "is_relocation_needed": False
        }

    # Rule 2: Exact city match (e.g. Pune in Pune)
    if cand_loc_lower in job_loc or job_loc in cand_loc_lower:
        return {
            "multiplier": 1.0,
            "status": "local",
            "label": f"Local ({cand_loc})",
            "is_relocation_needed": False
        }

    # Rule 3: Common nearby clusters
    pune_cluster = {"pune", "pcmc", "pimpri", "chinchwad", "mumbai", "navi mumbai", "thane"}
    is_job_pune = any(c in job_loc for c in pune_cluster)
    is_cand_pune = any(c in cand_loc_lower for c in pune_cluster)
    if is_job_pune and is_cand_pune:
        return {
            "multiplier": 0.90,
            "status": "nearby",
            "label": f"Nearby ({cand_loc})",
            "is_relocation_needed": False
        }

    ncr_cluster = {"delhi", "new delhi", "noida", "greater noida", "gurgaon", "gurugram", "faridabad", "ghaziabad"}
    is_job_ncr = any(c in job_loc for c in ncr_cluster)
    is_cand_ncr = any(c in cand_loc_lower for c in ncr_cluster)
    if is_job_ncr and is_cand_ncr:
        return {
            "multiplier": 0.90,
            "status": "nearby",
            "label": f"Nearby ({cand_loc})",
            "is_relocation_needed": False
        }

    # Rule 4: Far away city -> relocation needed
    return {
        "multiplier": 0.70,
        "status": "relocation",
        "label": f"⚠️ Relocation Needed (Currently in {cand_loc})",
        "is_relocation_needed": True
    }


def match_candidates_for_job(db: Session, job_id: str):
    # 1. Safety Check UUID
    try:
        valid_uuid = UUID(job_id)
    except ValueError:
        return []

    job = db.query(JobPosting).filter(JobPosting.id == valid_uuid).first()

    if not job:
        return []

    job_skills = job.required_skills if job.required_skills else []
    candidates = db.query(User).filter(User.user_type == "jobseeker").all()

    # --- STAGE 1: FAST FILTERING (Cosine Similarity + Location Factor) ---
    initial_results = []

    for candidate in candidates:
        skills = db.query(UserSkill).filter(UserSkill.user_id == candidate.id).all()
        candidate_skills = [s.skill_name for s in skills]
        profile = db.query(UserProfile).filter(UserProfile.user_id == candidate.id).first()
        cand_loc = profile.location if profile else None

        loc_eval = evaluate_location_fit(job.location, job.type, cand_loc)
        fast_skill_score = calculate_match_score(job_skills, candidate_skills)
        fast_combined_score = round(fast_skill_score * loc_eval["multiplier"], 2)

        initial_results.append({
            "candidate": candidate,
            "skills": candidate_skills,
            "fast_score": fast_combined_score,
            "raw_skill_score": fast_skill_score,
            "loc_eval": loc_eval,
            "profile": profile,
        })

    # Sort by location-aware fast score and take ONLY Top 10
    initial_results.sort(key=lambda x: x["fast_score"], reverse=True)
    top_candidates = initial_results[:10]

    # --- STAGE 2: DEEP AI EVALUATION & UI DATA GATHERING ---
    final_results = []

    for item in top_candidates:
        candidate = item["candidate"]
        cand_skills = item["skills"]
        loc_eval = item["loc_eval"]
        profile = item["profile"]

        resume = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == candidate.id).first()

        try:
            # Call the LLM for deep reasoning (cached to guarantee consistent score across views)
            ai_eval = get_cached_ai_match(job_skills, cand_skills)
            skill_score = ai_eval.get("match_score", item["raw_skill_score"])
        except Exception as e:
            print(f"LLM Match Failed for {candidate.email}: {e}")
            # Safe Fallback
            ai_eval = {
                "match_score": item["raw_skill_score"],
                "reason": "AI evaluation temporarily unavailable. Score based on keyword matching.",
                "missing_skills": []
            }
            skill_score = item["raw_skill_score"]

        # Apply post location weighting to the final match score
        final_score = int(round(skill_score * loc_eval["multiplier"]))

        final_results.append({
            "candidate_id": str(candidate.id),
            "name": candidate.name,
            "email": candidate.email,
            "location": profile.location if profile else None,
            "location_fit": loc_eval,
            "resume_score": resume.overall_score if resume else None,
            "skill_match_score": skill_score,
            "match_score": final_score,
            "skills": cand_skills,
            "ai_evaluation": ai_eval
        })

    # Final sort based on the post-wise intelligent match score
    final_results.sort(key=lambda x: x["match_score"], reverse=True)

    return final_results