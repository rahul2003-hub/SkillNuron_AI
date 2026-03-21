from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSON
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    user_type = Column(String, nullable=False)  # jobseeker or recruiter
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    skill_name = Column(String, nullable=False)
    level = Column(Integer, nullable=False, default=50)
    category = Column(String, nullable=False, default="Programming")

    user = relationship("User", back_populates="skills")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    overall_score = Column(Integer)
    analysis_json = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="resume_analyses")