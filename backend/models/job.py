from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from database import Base
import uuid
from datetime import datetime, timezone


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String)
    type = Column(String)
    salary = Column(String)
    required_skills = Column(ARRAY(String))
    description = Column(String)
    posted_by = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))