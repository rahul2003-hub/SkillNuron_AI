from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from database import Base
import uuid
from datetime import datetime, timezone


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(100))
    type = Column(String(50))  # Full-time, Part-time, Contract, etc.
    salary = Column(String(100))
    required_skills = Column(ARRAY(String))
    description = Column(String)
    posted_by = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))