import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend folder to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# ============================================================
# Store shared data between tests
# ============================================================
test_data = {
    "user_id": None,
    "token": None,
    "job_id": None,
    "email": "testuser_pytest@skillneuron.com"
}

# ============================================================
# CLEANUP — runs before test_01 to delete old test user
# ============================================================

@pytest.fixture(autouse=True, scope="session")
def cleanup_test_user():
    """Delete test user from DB before running tests"""
    from database import SessionLocal
    from models.user import User, UserSkill
    from models.job import JobPosting

    db = SessionLocal()
    try:
        # Delete test user's skills first (foreign key)
        test_user = db.query(User).filter(
            User.email == "testuser_pytest@skillneuron.com"
        ).first()

        if test_user:
            db.query(UserSkill).filter(
                UserSkill.user_id == test_user.id
            ).delete()
            db.delete(test_user)

        # Delete test jobs
        db.query(JobPosting).filter(
            JobPosting.company == "TechStartup Mumbai"
        ).delete()

        db.commit()
        print("\n🧹 Test cleanup done — old test data removed")
    except Exception as e:
        print(f"\n⚠️ Cleanup warning: {e}")
        db.rollback()
    finally:
        db.close()

# ============================================================
# AUTH TESTS
# ============================================================

def test_01_register_user():
    """Test 1 — Register a new user"""
    print("\n🧪 Test 1: Register user")
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": test_data["email"],
        "password": "test123456",
        "user_type": "jobseeker"
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "token" in data
    assert data["user"]["email"] == test_data["email"]

    # Save for next tests
    test_data["user_id"] = data["user"]["id"]
    test_data["token"] = data["token"]
    print(f"✅ User registered. ID: {test_data['user_id']}")


def test_02_register_duplicate_email():
    """Test 2 — Register same email again should fail"""
    print("\n🧪 Test 2: Duplicate email registration")
    response = client.post("/api/auth/register", json={
        "name": "Another User",
        "email": test_data["email"],
        "password": "test123456",
        "user_type": "jobseeker"
    })
    print(f"Status: {response.status_code}")
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
    print("✅ Duplicate email correctly rejected")


def test_03_login_correct():
    """Test 3 — Login with correct credentials"""
    print("\n🧪 Test 3: Login correct")
    response = client.post("/api/auth/login", json={
        "email": test_data["email"],
        "password": "test123456",
        "user_type": "jobseeker"
    })
    print(f"Status: {response.status_code}")
    data = response.json()
    assert response.status_code == 200
    assert data["success"] == True
    assert "token" in data
    print("✅ Login successful")


def test_04_login_wrong_password():
    """Test 4 — Login with wrong password should fail"""
    print("\n🧪 Test 4: Wrong password")
    response = client.post("/api/auth/login", json={
        "email": test_data["email"],
        "password": "wrongpassword",
        "user_type": "jobseeker"
    })
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Wrong password correctly rejected")


def test_05_login_wrong_user_type():
    """Test 5 — Login as recruiter when registered as jobseeker"""
    print("\n🧪 Test 5: Wrong user type")
    response = client.post("/api/auth/login", json={
        "email": test_data["email"],
        "password": "test123456",
        "user_type": "recruiter"
    })
    print(f"Status: {response.status_code}")
    assert response.status_code == 401
    print("✅ Wrong user type correctly rejected")


# ============================================================
# SKILLS TESTS
# ============================================================

def test_06_save_skills():
    """Test 6 — Save skills to PostgreSQL"""
    print("\n🧪 Test 6: Save skills")

    if not test_data["user_id"]:
        pytest.skip("user_id not available — run test_01 first")

    response = client.post("/api/profile/skills/save", json={
        "user_id": test_data["user_id"],
        "skills": [
            {"skill_name": "Python", "level": 80, "category": "Programming"},
            {"skill_name": "React", "level": 75, "category": "Frontend"},
            {"skill_name": "SQL", "level": 65, "category": "Database"},
            {"skill_name": "FastAPI", "level": 70, "category": "Programming"},
        ]
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    assert response.status_code == 200
    assert response.json()["success"] == True
    print("✅ Skills saved to PostgreSQL")


def test_07_get_skills():
    """Test 7 — Get skills from PostgreSQL"""
    print("\n🧪 Test 7: Get skills")

    if not test_data["user_id"]:
        pytest.skip("user_id not available")

    response = client.get(f"/api/profile/skills/{test_data['user_id']}")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Skills found: {len(data['skills'])}")

    assert response.status_code == 200
    assert data["success"] == True
    assert len(data["skills"]) == 4

    skill_names = [s["name"] for s in data["skills"]]
    assert "Python" in skill_names
    assert "React" in skill_names
    print(f"✅ Skills retrieved: {skill_names}")


def test_08_save_skills_invalid_user():
    """Test 8 — Save skills for non-existent user"""
    print("\n🧪 Test 8: Save skills invalid user")
    response = client.post("/api/profile/skills/save", json={
        "user_id": "00000000-0000-0000-0000-000000000000",
        "skills": [{"skill_name": "Python", "level": 80, "category": "Programming"}]
    })
    print(f"Status: {response.status_code}")
    assert response.status_code == 404
    print("✅ Invalid user correctly rejected")


# ============================================================
# AI TESTS
# ============================================================

def test_09_skill_gap_analysis():
    """Test 9 — Real AI skill gap analysis"""
    print("\n🧪 Test 9: Skill gap analysis (real AI)")
    response = client.post("/api/profile/skill-gap", json={
        "user_skills": ["Python", "HTML", "CSS", "React"],
        "target_role": "Backend Developer"
    })
    print(f"Status: {response.status_code}")
    data = response.json()

    assert response.status_code == 200
    assert data["success"] == True
    assert "analysis" in data
    assert "missing_skills" in data["analysis"]
    assert "action_plan" in data["analysis"]
    assert "summary" in data["analysis"]
    print(f"✅ AI returned {len(data['analysis']['missing_skills'])} missing skills")
    print(f"   Summary: {data['analysis']['summary'][:80]}...")


def test_10_skill_gap_empty_skills():
    """Test 10 — Skill gap with empty skills should fail"""
    print("\n🧪 Test 10: Skill gap empty skills")
    response = client.post("/api/profile/skill-gap", json={
        "user_skills": [],
        "target_role": "Developer"
    })
    print(f"Status: {response.status_code}")
    assert response.status_code == 400
    print("✅ Empty skills correctly rejected")


def test_11_career_path():
    """Test 11 — Real AI career path recommendation"""
    print("\n🧪 Test 11: Career path (real AI)")
    response = client.post("/api/profile/career-path", json={
        "user_skills": ["Python", "Django", "SQL"],
        "experience_years": 2,
        "target_role": "Full Stack Developer"
    })
    print(f"Status: {response.status_code}")
    data = response.json()

    assert response.status_code == 200
    assert data["success"] == True
    assert "recommendation" in data
    assert "career_paths" in data["recommendation"]
    assert "next_steps" in data["recommendation"]

    # Check Indian salary format
    first_path = data["recommendation"]["career_paths"][0]
    salary = first_path.get("averageSalary", "")
    print(f"   Salary format: {salary}")
    print(f"✅ Career path returned {len(data['recommendation']['career_paths'])} paths")


# ============================================================
# JOBS TESTS
# ============================================================

def test_12_create_job():
    """Test 12 — Create a job posting in PostgreSQL"""
    print("\n🧪 Test 12: Create job posting")
    response = client.post("/api/jobs/", json={
        "title": "Python Backend Developer",
        "company": "TechStartup Mumbai",
        "location": "Mumbai",
        "type": "Full-time",
        "salary": "₹8,00,000 - ₹12,00,000",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "description": "We are looking for a Python developer to join our team.",
        "posted_by": "Test Recruiter"
    })
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {data}")

    assert response.status_code == 200
    assert data["success"] == True
    assert data["job"]["title"] == "Python Backend Developer"

    test_data["job_id"] = data["job"]["id"]
    print(f"✅ Job created. ID: {test_data['job_id']}")


def test_13_get_all_jobs():
    """Test 13 — Get all jobs from PostgreSQL"""
    print("\n🧪 Test 13: Get all jobs")
    response = client.get("/api/jobs/")
    print(f"Status: {response.status_code}")
    data = response.json()

    assert response.status_code == 200
    assert data["success"] == True
    assert data["total"] >= 1
    print(f"✅ Found {data['total']} jobs in database")


def test_14_job_matching():
    """Test 14 — AI job matching"""
    print("\n🧪 Test 14: AI job matching")
    response = client.post("/api/jobs/match", json={
        "user_skills": ["Python", "FastAPI", "SQL"]
    })
    print(f"Status: {response.status_code}")
    data = response.json()

    assert response.status_code == 200
    assert data["success"] == True
    print(f"✅ Job matching returned {len(data['matches'])} matches")
    if data["matches"]:
        print(f"   Top match score: {data['matches'][0].get('match_score')}%")


def test_15_delete_job():
    """Test 15 — Delete job from PostgreSQL"""
    print("\n🧪 Test 15: Delete job")

    if not test_data["job_id"]:
        pytest.skip("job_id not available")

    response = client.delete(f"/api/jobs/{test_data['job_id']}")
    print(f"Status: {response.status_code}")

    assert response.status_code == 200
    assert response.json()["success"] == True

    # Verify it's gone
    get_response = client.get("/api/jobs/")
    jobs = get_response.json()["jobs"]
    ids = [j["id"] for j in jobs]
    assert test_data["job_id"] not in ids
    print("✅ Job deleted and verified gone from database")


# ============================================================
# HEALTH CHECK
# ============================================================

def test_00_health_check():
    """Test 0 — Server is running"""
    print("\n🧪 Test 0: Health check")
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ Server is healthy")
