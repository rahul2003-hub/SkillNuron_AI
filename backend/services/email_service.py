
import os
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv(
    "RESEND_SENDER_EMAIL",
    "onboarding@resend.dev"
)

if API_KEY:
    resend.api_key = API_KEY


def send_email(to_email: str, subject: str, html: str) -> bool:
    """Send an email through Resend."""
    if not API_KEY:
        logger.warning("Email not sent: RESEND_API_KEY is not configured.")
        return False

    try:
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent successfully to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False
