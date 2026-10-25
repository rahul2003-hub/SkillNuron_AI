from types import SimpleNamespace
import uuid

import pytest
from pydantic import ValidationError

from routes.profile import UpdateProfileRequest
from routes import recruiter
from services import match_services


def test_ai_match_cache_is_bounded_and_uses_lru(monkeypatch):
    calls = []

    def fake_ai_candidate_match(job_skills, candidate_skills):
        calls.append((job_skills, candidate_skills))
        return {"match_score": len(calls)}

    monkeypatch.setattr(match_services, "ai_candidate_match", fake_ai_candidate_match)
    match_services._cached_ai_match.cache_clear()

    for index in range(match_services._cached_ai_match.cache_info().maxsize + 1):
        match_services.get_cached_ai_match([f"job-{index}"], ["candidate"])

    cache_info = match_services._cached_ai_match.cache_info()
    assert cache_info.currsize == cache_info.maxsize == 512

    match_services.get_cached_ai_match(["job-0"], ["candidate"])
    assert len(calls) == 514
    match_services._cached_ai_match.cache_clear()


def test_candidate_location_filter():
    profile = SimpleNamespace(location="Pune, Maharashtra", experience_years=2)

    assert match_services.candidate_matches_filters(profile, location="pune")
    assert not match_services.candidate_matches_filters(profile, location="Mumbai")


def test_candidate_minimum_experience_filter():
    profile = SimpleNamespace(location="Pune", experience_years=4)

    assert match_services.candidate_matches_filters(profile, min_experience=4)
    assert not match_services.candidate_matches_filters(profile, min_experience=5)


def test_candidate_location_and_experience_filters_together():
    profile = SimpleNamespace(location="Navi Mumbai", experience_years=6)

    assert match_services.candidate_matches_filters(profile, "mumbai", 5)
    assert not match_services.candidate_matches_filters(profile, "Pune", 5)
    assert not match_services.candidate_matches_filters(profile, "Mumbai", 7)


def test_existing_candidate_without_profile_matches_default_filters():
    assert match_services.candidate_matches_filters(None)
    assert not match_services.candidate_matches_filters(None, min_experience=1)


def test_matching_route_forwards_both_filters(monkeypatch):
    received = {}
    job_id = str(uuid.uuid4())
    current_user = SimpleNamespace(id=uuid.uuid4())

    class OwnedJobQuery:
        def filter(self, *_args):
            return self

        def first(self):
            return SimpleNamespace(posted_by_id=current_user.id)

    class Database:
        def query(self, *_args):
            return OwnedJobQuery()

    def fake_match(db, job_id, location, min_experience):
        received.update(job_id=job_id, location=location, min_experience=min_experience)
        return []

    monkeypatch.setattr(recruiter, "match_candidates_for_job", fake_match)
    recruiter.get_candidate_matches(job_id, "Pune", 3, Database(), current_user)

    assert received == {"job_id": job_id, "location": "Pune", "min_experience": 3}


def test_profile_experience_years_validation():
    assert UpdateProfileRequest(experience_years=7).experience_years == 7
    with pytest.raises(ValidationError):
        UpdateProfileRequest(experience_years=-1)
    with pytest.raises(ValidationError):
        UpdateProfileRequest(experience_years=61)
