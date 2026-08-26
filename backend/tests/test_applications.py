"""Save as: backend/tests/test_applications.py (new file)

Covers: POST /applications/apply/{job_id}, PATCH /applications/{id}/status,
GET /applications/my, GET /applications/job/{id}, notifications.
Uses the as_jobseeker / as_recruiter / as_other_recruiter fixtures from
conftest.py (dependency_overrides — no real Supabase network calls).
"""

import uuid


def _create_job(client, posted_by_id=None) -> dict:
    """Helper: create a job via the API as the currently-authenticated
    recruiter client. Returns the created job dict.
    """
    response = client.post("/api/jobs/", json={
        "title": "Pytest Backend Developer",
        "company": "Pytest Co",
        "location": "Mumbai",
        "type": "Full-time",
        "salary": "₹8,00,000 - ₹12,00,000",
        "required_skills": ["Python", "FastAPI"],
        "description": "Pytest fixture job posting.",
        "posted_by": "Pytest Recruiter",
    })
    assert response.status_code == 200, response.text
    return response.json()["job"]


# ============================================================
# Apply flow
# ============================================================

def test_apply_to_job_success(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)

    response = as_jobseeker.post(f"/applications/apply/{job['id']}")
    assert response.status_code == 200, response.text
    data = response.json()
    assert "application_id" in data
    uuid.UUID(data["application_id"])  # valid UUID


def test_apply_duplicate_rejected(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)

    first = as_jobseeker.post(f"/applications/apply/{job['id']}")
    assert first.status_code == 200

    second = as_jobseeker.post(f"/applications/apply/{job['id']}")
    assert second.status_code == 400
    assert "already applied" in second.json()["detail"].lower()


def test_apply_invalid_job_id_format(as_jobseeker):
    response = as_jobseeker.post("/applications/apply/not-a-uuid")
    assert response.status_code == 400


def test_apply_nonexistent_job(as_jobseeker):
    fake_id = str(uuid.uuid4())
    response = as_jobseeker.post(f"/applications/apply/{fake_id}")
    assert response.status_code == 404


# ============================================================
# Status transitions
# ============================================================

def test_status_transition_valid(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    response = as_recruiter.patch(
        f"/applications/{application_id}/status",
        json={"status": "shortlisted"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "shortlisted"


def test_status_transition_invalid_value_rejected(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    response = as_recruiter.patch(
        f"/applications/{application_id}/status",
        json={"status": "not_a_real_status"}
    )
    assert response.status_code == 400


def test_status_transition_nonexistent_application(as_recruiter):
    fake_id = str(uuid.uuid4())
    response = as_recruiter.patch(
        f"/applications/{fake_id}/status",
        json={"status": "hired"}
    )
    assert response.status_code == 404


def test_status_transition_non_owner_forbidden(as_jobseeker, as_recruiter, as_other_recruiter):
    """A recruiter who did not post the job cannot change its
    applications' status — enforced via posted_by_id FK."""
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    response = as_other_recruiter.patch(
        f"/applications/{application_id}/status",
        json={"status": "hired"}
    )
    assert response.status_code == 403


def test_status_transition_full_pipeline(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    for status in ("shortlisted", "hired"):
        response = as_recruiter.patch(
            f"/applications/{application_id}/status",
            json={"status": status}
        )
        assert response.status_code == 200
        assert response.json()["status"] == status


# ============================================================
# Jobseeker-facing visibility
# ============================================================

def test_my_applications_reflects_status(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    as_recruiter.patch(f"/applications/{application_id}/status", json={"status": "rejected"})

    response = as_jobseeker.get("/applications/my")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    match = next((a for a in data["applications"] if a["application_id"] == application_id), None)
    assert match is not None, "Application not found in /applications/my"
    assert match["status"] == "rejected"
    assert match["job_title"] == job["title"]


def test_recruiter_sees_applicant_in_job_applications(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    as_jobseeker.post(f"/applications/apply/{job['id']}")

    response = as_recruiter.get(f"/applications/job/{job['id']}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["applications"]) >= 1
    assert any(a["email"] for a in data["applications"])


# ============================================================
# Notifications — created on status change
# ============================================================

def test_notification_created_on_status_change(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]

    as_recruiter.patch(f"/applications/{application_id}/status", json={"status": "shortlisted"})

    response = as_jobseeker.get("/applications/notifications")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["unread_count"] >= 1
    assert any("shortlisted" in n["message"] for n in data["notifications"])


def test_mark_notifications_read(as_jobseeker, as_recruiter):
    job = _create_job(as_recruiter)
    apply_resp = as_jobseeker.post(f"/applications/apply/{job['id']}")
    application_id = apply_resp.json()["application_id"]
    as_recruiter.patch(f"/applications/{application_id}/status", json={"status": "hired"})

    mark_response = as_jobseeker.post("/applications/notifications/mark-read")
    assert mark_response.status_code == 200
    assert mark_response.json()["success"] is True

    check_response = as_jobseeker.get("/applications/notifications")
    assert check_response.json()["unread_count"] == 0