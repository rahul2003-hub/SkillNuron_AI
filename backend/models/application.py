from sqlalchemy import Column, ForeignKey, Float, String
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from database import Base


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    job_id = Column(UUID(as_uuid=True), ForeignKey("job_postings.id"))
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    match_score = Column(Float)

    status = Column(String, default="applied")

    job = relationship("JobPosting")
    candidate = relationship("User")