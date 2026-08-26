import sys
import os
import uuid
import pytest
from fastapi import HTTPException, Request, status
from fastapi.testclient import TestClient
 
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
 
from main import app
from database import SessionLocal
from models.user import User, UserSkill, UserProfile, ResumeAnalysis
from models.job import JobPosting
from models.application import JobApplication, Notification
from deps import get_current_user, require_recruiter
 
TEST_JOBSEEKER_EMAIL = "pytest_jobseeker@skillnuron.test"
TEST_RECRUITER_EMAIL = "pytest_recruiter@skillnuron.test"
TEST_OTHER_RECRUITER_EMAIL = "pytest_other_recruiter@skillnuron.test"
 
ALL_TEST_EMAILS = [TEST_JOBSEEKER_EMAIL, TEST_RECRUITER_EMAIL, TEST_OTHER_RECRUITER_EMAIL]
 
TEST_USER_HEADER = "X-Test-User-Id"
 
 
def _get_or_create_user(db, email: str, name: str, user_type: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        id=uuid.uuid4(),
        name=name,
        email=email,
        password_hash="test_fixture",
        user_type=user_type,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
 
def _wipe_fixture_data(db):
    users = db.query(User).filter(User.email.in_(ALL_TEST_EMAILS)).all()
    user_ids = [u.id for u in users]
 
    if not user_ids:
        return
 
    jobs = db.query(JobPosting).filter(JobPosting.posted_by_id.in_(user_ids)).all()
    job_ids = [j.id for j in jobs]
 
    # Children referencing users or jobs — delete first.
    db.query(Notification).filter(Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(JobApplication).filter(JobApplication.candidate_id.in_(user_ids)).delete(synchronize_session=False)
    if job_ids:
        db.query(JobApplication).filter(JobApplication.job_id.in_(job_ids)).delete(synchronize_session=False)
    db.query(UserSkill).filter(UserSkill.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id.in_(user_ids)).delete(synchronize_session=False)
    db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).delete(synchronize_session=False)
 
    if job_ids:
        db.query(JobPosting).filter(JobPosting.id.in_(job_ids)).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
    db.commit()

def _override_get_current_user(request: Request) -> User:
    raw_id = request.headers.get(TEST_USER_HEADER)
    if not raw_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing {TEST_USER_HEADER} test header",
        )
    try:
        user_uuid = uuid.UUID(raw_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid test user id")
 
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown test user")
        return user
    finally:
        db.close()

def _override_require_recruiter(request: Request) -> User:
    user = _override_get_current_user(request)
    if user.user_type != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to recruiters",
        )
    return user

@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="session")
def jobseeker_user(db_session):
    return _get_or_create_user(db_session, TEST_JOBSEEKER_EMAIL, "Pytest Jobseeker", "jobseeker")

@pytest.fixture(scope="session")
def recruiter_user(db_session):
    return _get_or_create_user(db_session, TEST_RECRUITER_EMAIL, "Pytest Recruiter", "recruiter")

@pytest.fixture(scope="session")
def other_recruiter_user(db_session):
    return _get_or_create_user(db_session, TEST_OTHER_RECRUITER_EMAIL, "Pytest Other Recruiter", "recruiter")
 
@pytest.fixture(scope="session", autouse=True)
def _install_test_auth_overrides():
    app.dependency_overrides[get_current_user] = _override_get_current_user
    app.dependency_overrides[require_recruiter] = _override_require_recruiter
    yield
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_recruiter, None)
    
@pytest.fixture
def as_jobseeker(jobseeker_user, _install_test_auth_overrides):
    client = TestClient(app)
    client.headers.update({TEST_USER_HEADER: str(jobseeker_user.id)})
    return client

@pytest.fixture
def as_recruiter(recruiter_user, _install_test_auth_overrides):
    client = TestClient(app)
    client.headers.update({TEST_USER_HEADER: str(recruiter_user.id)})
    return client
 
@pytest.fixture
def as_other_recruiter(other_recruiter_user, _install_test_auth_overrides):
    client = TestClient(app)
    client.headers.update({TEST_USER_HEADER: str(other_recruiter_user.id)})
    return client
    
@pytest.fixture(autouse=True, scope="session")
def cleanup_fixture_data(db_session):
    _wipe_fixture_data(db_session)
    yield
    _wipe_fixture_data(db_session)