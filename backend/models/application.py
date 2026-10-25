from fastapi import HTTPException
from sqlalchemy import Column, ForeignKey, Float, Integer, String, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone

from database import Base

STAGES = ("applied", "screening", "interview", "offer", "hired", "rejected")
ALLOWED = {
    "applied": {"screening", "rejected"},
    "screening": {"interview", "rejected"},
    "interview": {"offer", "rejected"},
    "offer": {"hired", "rejected"},
}
ALLOWED_STATUSES = STAGES


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    match_score = Column(Float)
    cover_letter = Column(String, default="")
    expected_salary = Column(String, default="")
    resume_path = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)

    status = Column(String, default="applied")
    source = Column(String, default="direct", nullable=False)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    job = relationship("JobPosting")
    candidate = relationship("User")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")


class ApplicationEvent(Base):
    """Immutable record of a recruiter moving an application in the pipeline."""
    __tablename__ = "application_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    from_stage = Column(String, nullable=False)
    to_stage = Column(String, nullable=False)
    by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    note = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("JobApplication", back_populates="events")
    by_user = relationship("User")


class Invitation(Base):
    """A recruiter's invitation for a sourced candidate to apply to a job."""
    __tablename__ = "invitations"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id", name="uq_invitation_job_candidate"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    accepted_at = Column(DateTime, nullable=True)


class Interview(Base):
    """A recruiter-scheduled interview for a candidate application."""
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    starts_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=30)
    location = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


def move_stage(db, app: JobApplication, to_stage: str, user, note: str = "") -> ApplicationEvent:
    """Validate and persist one pipeline transition with its audit event."""
    if to_stage not in ALLOWED.get(app.status, set()):
        raise HTTPException(status_code=400, detail=f"Cannot go {app.status} → {to_stage}")

    event = ApplicationEvent(
        application_id=app.id,
        from_stage=app.status,
        to_stage=to_stage,
        by_user_id=user.id,
        note=note,
    )
    db.add(event)
    app.status = to_stage
    app.updated_at = datetime.now(timezone.utc)
    db.add(Notification(user_id=app.candidate_id, message=f"Update: now in {to_stage}"))
    return event


class Notification(Base):
    """In-app notification — created when an application status changes"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(String, default="false")  # "true"/"false" — kept simple, no Boolean migration needed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
