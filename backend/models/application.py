from sqlalchemy import Column, ForeignKey, Float, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from database import Base

ALLOWED_STATUSES = ("applied", "shortlisted", "rejected", "hired")


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    match_score = Column(Float)

    status = Column(String, default="applied")
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = relationship("JobPosting")
    candidate = relationship("User")


class Notification(Base):
    """In-app notification — created when an application status changes"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(String, default="false")  # "true"/"false" — kept simple, no Boolean migration needed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))