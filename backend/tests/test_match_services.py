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
