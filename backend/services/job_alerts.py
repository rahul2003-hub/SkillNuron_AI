"""Personalized, opt-in daily Adzuna job-alert email delivery."""

import logging
import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

import httpx


logger = logging.getLogger(__name__)
ADZUNA_SEARCH_URL = "https://api.adzuna.com/v1/api/jobs/in/search/1"
CITY_MAP = {
    "Mumbai": "mumbai", "Pune": "pune", "Bangalore": "bangalore",
    "Hyderabad": "hyderabad", "Delhi": "delhi", "Noida": "noida",
    "Chennai": "chennai", "Navi Mumbai": "navi-mumbai",
    "Kolkata": "kolkata", "Ahmedabad": "ahmedabad",
}


async def get_adzuna_matches(*, roles: list[str], skills: list[str], location: str, limit: int = 10) -> list[dict]:
    """Fetch up to ``limit`` real Adzuna jobs tailored to a profile."""
    app_id, app_key = os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        logger.warning("Daily job alerts skipped: Adzuna credentials are not configured")
        return []

    # Adzuna treats a long string of roles and skills as a restrictive search.
    # Search the primary role (or the first saved skill) broadly, then rank the
    # returned real jobs against the complete profile below.
    keywords = next((role.strip() for role in roles if role and role.strip()), "")
    if not keywords:
        keywords = next((skill.strip() for skill in skills if skill and skill.strip()), "")
    if not keywords:
        return []

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": keywords,
        "results_per_page": min(max(limit * 3, 10), 50),
        "content-type": "application/json",
    }
    if location.strip():
        params["where"] = CITY_MAP.get(location, location.lower())

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(ADZUNA_SEARCH_URL, params=params)
            response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Unable to fetch daily Adzuna job alerts")
        return []

    role_terms = [role.lower() for role in roles if role.strip()]
    skill_terms = [skill.lower() for skill in skills if skill.strip()]
    jobs = response.json().get("results", [])

    def score(job: dict) -> int:
        searchable = f"{job.get('title', '')} {job.get('description', '')}".lower()
        return sum(term in searchable for term in role_terms) * 3 + sum(term in searchable for term in skill_terms)

    jobs.sort(key=score, reverse=True)
    results, seen = [], set()
    for job in jobs:
        url = job.get("redirect_url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        results.append({
            "title": job.get("title", "Job opportunity"),
            "company": job.get("company", {}).get("display_name", "Company"),
            "location": job.get("location", {}).get("display_name", location or "India"),
            "url": url,
        })
        if len(results) == limit:
            break
    return results


def send_daily_job_alert_email(*, recipient_email: str, recipient_name: str, jobs: list[dict]) -> bool:
    """Send one daily job-alert email. SMTP errors never escape to the scheduler."""
    smtp_host, sender = os.getenv("SMTP_HOST"), os.getenv("SMTP_FROM")
    if not smtp_host or not sender or not jobs:
        return False

    lines = [f"Hi {recipient_name or 'there'},", "", "Here are your latest matching jobs from Adzuna:", ""]
    for index, job in enumerate(jobs, start=1):
        lines.extend([f"{index}. {job['title']} — {job['company']}", f"   {job['location']}", f"   Apply: {job['url']}", ""])
    lines.append("You are receiving this daily alert because you enabled job alerts in your SkillNuron profile.")

    message = EmailMessage()
    message["Subject"] = f"Your {len(jobs)} matching jobs for today"
    message["From"] = formataddr(("SkillNuron AI", sender))
    message["To"] = recipient_email
    message.set_content("\n".join(lines))
    try:
        with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587")), timeout=10) as client:
            if os.getenv("SMTP_USE_TLS", "true").lower() not in {"0", "false", "no"}:
                client.starttls()
            username, password = os.getenv("SMTP_USERNAME"), os.getenv("SMTP_PASSWORD")
            if username and password:
                client.login(username, password)
            client.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        logger.exception("Unable to send daily job alert to %s", recipient_email)
        return False
