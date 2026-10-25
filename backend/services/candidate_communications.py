"""Application communications for candidate and recruiter pipeline events.

Email delivery is optional: in-app notifications are always persisted, while
emails are sent only when SMTP settings have been configured.
"""

import logging
import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr


logger = logging.getLogger(__name__)


STATUS_COPY = {
    "screening": ("Application in screening", "The recruiter has moved your application to screening."),
    "interview": ("Interview stage", "Great news — the recruiter has moved your application to the interview stage."),
    "offer": ("Offer stage", "Great news — the recruiter has moved your application to the offer stage."),
    "shortlisted": ("You've been shortlisted", "Great news — the recruiter has shortlisted your application."),
    "rejected": ("Application update", "The recruiter has decided not to move forward with your application."),
    "hired": ("You've been hired", "Congratulations — the recruiter has marked your application as hired."),
    "applied": ("Application received", "Your application is now recorded as applied."),
}


def send_application_status_email(
    *, candidate_email: str, candidate_name: str, job_title: str, status: str
) -> bool:
    """Send a status update email when SMTP is configured.

    Returns ``False`` for an unconfigured or failed delivery so a transient
    mail-provider issue cannot prevent the recruiter from updating a candidate.
    """
    smtp_host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not smtp_host or not sender:
        logger.info("Status email skipped: SMTP_HOST and SMTP_FROM are required")
        return False

    subject, status_message = STATUS_COPY.get(
        status,
        ("Application status updated", f"Your application status is now {status}."),
    )
    message = EmailMessage()
    message["Subject"] = f"{subject}: {job_title}"
    message["From"] = formataddr(("SkillNuron AI", sender))
    message["To"] = candidate_email
    message.set_content(
        f"Hi {candidate_name or 'there'},\n\n"
        f"{status_message}\n\n"
        f"Role: {job_title}\n"
        f"Current status: {status.title()}\n\n"
        "You can sign in to SkillNuron AI to view your applications."
    )

    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() not in {"0", "false", "no"}

        with smtplib.SMTP(smtp_host, port, timeout=10) as client:
            if use_tls:
                client.starttls()
            if username and password:
                client.login(username, password)
            client.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        logger.exception("Unable to send status email to candidate")
        return False


def send_recruiter_new_application_email(
    *, recruiter_email: str, recruiter_name: str, candidate_name: str, job_title: str
) -> bool:
    """Notify a job owner that a candidate has applied to their job."""
    smtp_host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not smtp_host or not sender:
        logger.info("New application email skipped: SMTP_HOST and SMTP_FROM are required")
        return False

    message = EmailMessage()
    message["Subject"] = f"New application: {job_title}"
    message["From"] = formataddr(("SkillNuron AI", sender))
    message["To"] = recruiter_email
    message.set_content(
        f"Hi {recruiter_name or 'there'},\n\n"
        f"{candidate_name or 'A candidate'} has applied for your {job_title} posting.\n\n"
        "Sign in to SkillNuron AI to review the application and take the next step."
    )

    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() not in {"0", "false", "no"}

        with smtplib.SMTP(smtp_host, port, timeout=10) as client:
            if use_tls:
                client.starttls()
            if username and password:
                client.login(username, password)
            client.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        logger.exception("Unable to send new application email to recruiter")
        return False


def send_job_invitation_email(
    *, candidate_email: str, candidate_name: str, job_title: str, company: str, apply_url: str
) -> bool:
    """Send an optional email alongside the persisted job invitation notification."""
    smtp_host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not smtp_host or not sender:
        logger.info("Invitation email skipped: SMTP_HOST and SMTP_FROM are required")
        return False
    message = EmailMessage()
    message["Subject"] = f"You're invited to apply: {job_title}"
    message["From"] = formataddr(("SkillNuron AI", sender))
    message["To"] = candidate_email
    message.set_content(
        f"Hi {candidate_name or 'there'},\n\n"
        f"A recruiter invited you to apply for {job_title} at {company}.\n\n"
        f"Apply now: {apply_url}\n\n"
        "Sign in if prompted, then select Apply invitation."
    )
    message.add_alternative(
        f"<p>Hi {candidate_name or 'there'},</p>"
        f"<p>A recruiter invited you to apply for <strong>{job_title}</strong> at {company}.</p>"
        f"<p><a href=\"{apply_url}\">Apply to this job</a></p>"
        "<p>Sign in if prompted, then select <strong>Apply invitation</strong>.</p>",
        subtype="html",
    )
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() not in {"0", "false", "no"}
        with smtplib.SMTP(smtp_host, port, timeout=10) as client:
            if use_tls:
                client.starttls()
            if username and password:
                client.login(username, password)
            client.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError):
        logger.exception("Unable to send invitation email to candidate")
        return False


def send_new_job_match_email(
    *, candidate_email: str, candidate_name: str, job_title: str, company: str, match_score: int
) -> bool:
    """Email an opted-in candidate about a newly posted internal job match."""
    smtp_host = os.getenv("SMTP_HOST")
    sender = os.getenv("SMTP_FROM")
    if not smtp_host or not sender:
        logger.info("New-job match email skipped: SMTP_HOST and SMTP_FROM are required")
        return False
    message = EmailMessage()
    message["Subject"] = f"New job matches your profile: {job_title}"
    message["From"] = formataddr(("SkillNuron AI", sender))
    message["To"] = candidate_email
    message.set_content(
        f"Hi {candidate_name or 'there'},\n\n"
        f"{job_title} at {company} is a {match_score}% match for your profile.\n\n"
        "Sign in to SkillNuron AI to review the role and apply."
    )
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
        logger.exception("Unable to send new-job match email to %s", candidate_email)
        return False
