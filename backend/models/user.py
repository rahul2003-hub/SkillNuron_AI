from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSON
from sqlalchemy.orm import relationship, validates
from database import Base
import uuid
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    user_type = Column(String(20), nullable=False)  # jobseeker or recruiter
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @validates('email')
    def validate_email(self, key, email):
        if not email or '@' not in email:
            raise ValueError("Invalid email address")
        return email.lower()

    @validates('user_type')
    def validate_user_type(self, key, user_type):
        if user_type not in ['jobseeker', 'recruiter']:
            raise ValueError("user_type must be 'jobseeker' or 'recruiter'")
        return user_type


class UserProfile(Base):
    """Extended profile info — 1 row per user"""
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    education = Column(String(200), default="")        # BCA / MCA / B.Tech etc.
    education_status = Column(String(50), default="")  # Completed / Pursuing
    graduation_year = Column(String(10), default="")   # 2024 / 2025 etc.
    current_status = Column(String(50), default="")    # Student / Fresher / Working
    target_roles = Column(ARRAY(String), default=list)  # Stores up to 3 roles
    primary_role = Column(String(100), default="")      # The main role used by AI
    location = Column(String(100), default="")         # Mumbai / Pune etc.
    phone = Column(String(20), default="")
    linkedin = Column(String(255), default="")
    github = Column(String(255), default="")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    level = Column(Integer, nullable=False, default=50)
    category = Column(String(50), nullable=False, default="Programming")

    user = relationship("User", back_populates="skills")

    __table_args__ = (
        CheckConstraint('level >= 0 AND level <= 100', name='check_skill_level_range'),
    )


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Integer)
    analysis_json = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="resume_analyses")