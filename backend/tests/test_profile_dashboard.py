"""Save as: backend/tests/test_profile_dashboard.py (new file)

Covers: GET /api/profile/dashboard, GET /api/jobs/mine,
POST /api/profile/skills/save (server-side auto-categorization + bucket),
GET /api/profile/catalog.
"""

import uuid


# ============================================================
# Catalog
# ============================================================

def test_get_catalog(as_jobseeker):
    response = as_jobseeker.get("/api/profile/catalog")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    catalog = data["catalog"]
    assert "cities" in catalog
    assert "application_statuses" in catalog
    assert set(catalog["application_statuses"]) == {"applied", "shortlisted", "rejected", "hired"}
    assert "category_bucket_map" in catalog
    assert catalog["category_bucket_map"].get("Programming") == "Core"


# ============================================================
# Skills save — server-side categorization
# ============================================================

def test_save_skills_auto_categorizes_known_skill(as_jobseeker, jobseeker_user):
    response = as_jobseeker.post("/api/profile/skills/save", json={
        "skills": [
            {"skill_name": "React", "level": "Advanced"},  # no category supplied
        ]
    })
    assert response.status_code == 200, response.text

    get_response = as_jobseeker.get(f"/api/profile/skills/{jobseeker_user.id}")
    assert get_response.status_code == 200
    skills = get_response.json()["skills"]
    react_skill = next((s for s in skills if s["name"] == "React"), None)
    assert react_skill is not None
    assert react_skill["category"] in ("Frontend", "Programming")  # suggestions or keyword fallback
    assert react_skill["bucket"] in ("Core", "Secondary", "Emerging & Tools")


def test_save_skills_keyword_fallback_categorization(as_jobseeker, jobseeker_user):
    """A skill name not in SKILL_SUGGESTIONS but matching a DevOps keyword
    should be auto-categorized via the fallback rules in catalog.py."""
    response = as_jobseeker.post("/api/profile/skills/save", json={
        "skills": [
            {"skill_name": "Kubernetes Administration", "level": "Intermediate"},
        ]
    })
    assert response.status_code == 200

    get_response = as_jobseeker.get(f"/api/profile/skills/{jobseeker_user.id}")
    skills = get_response.json()["skills"]
    skill = next((s for s in skills if s["name"] == "Kubernetes Administration"), None)
    assert skill is not None
    assert skill["category"] == "DevOps & Cloud"
    assert skill["bucket"] == "Emerging & Tools"


def test_save_skills_invalid_level_defaults_to_intermediate(as_jobseeker, jobseeker_user):
    response = as_jobseeker.post("/api/profile/skills/save", json={
        "skills": [
            {"skill_name": "Rust", "level": "Godlike"},  # not a valid SkillLevel
        ]
    })
    assert response.status_code == 200

    get_response = as_jobseeker.get(f"/api/profile/skills/{jobseeker_user.id}")
    skills = get_response.json()["skills"]
    rust_skill = next((s for s in skills if s["name"] == "Rust"), None)
    assert rust_skill is not None
    assert rust_skill["level"] == "Intermediate"


def test_save_skills_deduplicates_case_insensitive(as_jobseeker, jobseeker_user):
    response = as_jobseeker.post("/api/profile/skills/save", json={
        "skills": [
            {"skill_name": "python", "level": "Beginner"},
            {"skill_name": "Python", "level": "Expert"},
        ]
    })
    assert response.status_code == 200

    get_response = as_jobseeker.get(f"/api/profile/skills/{jobseeker_user.id}")
    skills = get_response.json()["skills"]
    python_matches = [s for s in skills if s["name"].lower() == "python"]
    assert len(python_matches) == 1
    assert python_matches[0]["level"] == "Expert"  # last one wins


def test_get_skills_forbidden_for_other_jobseeker(as_jobseeker, as_recruiter, recruiter_user):
    """A jobseeker cannot view another arbitrary user's skills (only
    recruiters or the owner can)."""
    fake_user_id = str(uuid.uuid4())
    response = as_jobseeker.get(f"/api/profile/skills/{fake_user_id}")
    assert response.status_code == 403


# ============================================================
# Dashboard
# ============================================================

def test_dashboard_reflects_skills_and_applications(as_jobseeker, as_recruiter, jobseeker_user):
    # Ensure at least one skill exists
    as_jobseeker.post("/api/profile/skills/save", json={
        "skills": [{"skill_name": "Python", "level": "Advanced"}]
    })

    # Create + apply to a job so applications_count > 0
    job_resp = as_recruiter.post("/api/jobs/", json={
        "title": "Dashboard Test Job",
        "company": "Pytest Co",
        "location": "Pune",
        "type": "Full-time",
        "salary": "Not disclosed",
        "required_skills": ["Python"],
        "description": "Dashboard test fixture.",
        "posted_by": "Pytest Recruiter",
    })
    job_id = job_resp.json()["job"]["id"]
    as_jobseeker.post(f"/applications/apply/{job_id}")

    response = as_jobseeker.get("/api/profile/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["skills_count"] >= 1
    assert data["applications_count"] >= 1
    assert 0 <= data["profile_completeness"] <= 100
    assert data["profile_completeness"] % 25 == 0


def test_dashboard_zero_state_for_fresh_profile(as_jobseeker):
    """Completeness should never error even with no profile/skills/resume —
    it should just compute a low score, not throw."""
    response = as_jobseeker.get("/api/profile/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["profile_completeness"], int)


# ============================================================
# Jobs — /mine filtered by posted_by_id, not display name
# ============================================================

def test_jobs_mine_returns_only_own_jobs(as_recruiter, as_other_recruiter):
    own_job = as_recruiter.post("/api/jobs/", json={
        "title": "Owned By Recruiter A",
        "company": "Pytest Co",
        "location": "Mumbai",
        "type": "Full-time",
        "salary": "Not disclosed",
        "required_skills": ["Python"],
        "description": "Owned by recruiter A.",
        "posted_by": "Recruiter A",
    }).json()["job"]

    other_job = as_other_recruiter.post("/api/jobs/", json={
        "title": "Owned By Recruiter B",
        "company": "Pytest Co",
        "location": "Mumbai",
        "type": "Full-time",
        "salary": "Not disclosed",
        "required_skills": ["Python"],
        "description": "Owned by recruiter B.",
        "posted_by": "Recruiter B",
    }).json()["job"]

    response = as_recruiter.get("/api/jobs/mine")
    assert response.status_code == 200
    data = response.json()
    job_ids = [j["id"] for j in data["jobs"]]

    assert own_job["id"] in job_ids
    assert other_job["id"] not in job_ids


def test_jobs_mine_requires_recruiter(as_jobseeker):
    response = as_jobseeker.get("/api/jobs/mine")
    assert response.status_code == 403


# ============================================================
# Jobs — delete_job UUID validation
# ============================================================

def test_delete_job_invalid_uuid_returns_400(as_recruiter):
    response = as_recruiter.delete("/api/jobs/not-a-valid-uuid")
    assert response.status_code == 400


def test_delete_job_nonexistent_returns_404(as_recruiter):
    fake_id = str(uuid.uuid4())
    response = as_recruiter.delete(f"/api/jobs/{fake_id}")
    assert response.status_code == 404


def test_delete_job_non_owner_forbidden(as_recruiter, as_other_recruiter):
    job = as_recruiter.post("/api/jobs/", json={
        "title": "Delete Ownership Test",
        "company": "Pytest Co",
        "location": "Mumbai",
        "type": "Full-time",
        "salary": "Not disclosed",
        "required_skills": ["Python"],
        "description": "Delete ownership test fixture.",
        "posted_by": "Recruiter A",
    }).json()["job"]

    response = as_other_recruiter.delete(f"/api/jobs/{job['id']}")
    assert response.status_code == 403