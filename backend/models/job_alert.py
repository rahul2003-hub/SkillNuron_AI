import uuid
from datetime import date

from sqlalchemy import Boolean, Column, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class JobAlertPreference(Base):
    """A job seeker's consent and delivery state for daily job-alert emails."""
    __tablename__ = "job_alert_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    last_sent_on = Column(Date, nullable=True)
