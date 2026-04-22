from faker import Faker
import random
import uuid

# Adjusted import to work if script is run from the backend root
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.user import User, UserProfile, UserSkill, ResumeAnalysis

fake = Faker()

skills_pool = [
    "Python", "FastAPI", "React", "Node.js", "SQL", "Docker",
    "AWS", "Machine Learning", "TensorFlow", "PyTorch",
    "Java", "Spring Boot", "TypeScript", "Next.js",
    "Agentic AI", "LangChain", "Kubernetes", "Terraform", 
    "Snowflake", "FinOps", "Cybersecurity", "Blockchain",
    "Vector Databases", "Prompt Engineering"
]

locations = [
    "Mumbai", "Navi Mumbai" "Pune", "Bangalore", "Delhi", "Hyderabad", "Chennai",
]

def seed_candidates():
    db = SessionLocal()
    print("Seeding candidates...")

    for _ in range(120):
        email = fake.unique.email()
        name = fake.name()

        # FIXED: mapped correct columns (name, password_hash, user_type)
        user = User(
            id=uuid.uuid4(),
            name=name,
            email=email,
            password_hash="seed_password",
            user_type="jobseeker"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        # FIXED: Removed 'bio' and 'full_name' (don't exist). Added 'primary_role'.
        profile = UserProfile(
            user_id=user.id,
            location=random.choice(locations),
            primary_role="Software Developer",
            current_status=random.choice(["Fresher", "Working", "Student"])
        )

        db.add(profile)

        # random skills
        candidate_skills = random.sample(skills_pool, random.randint(3, 6))

        for skill in candidate_skills:
            # FIXED: Added 'level' for completeness
            skill_obj = UserSkill(
                user_id=user.id,
                skill_name=skill,
                level=random.randint(50, 100)
            )
            db.add(skill_obj)

        # resume score
        # FIXED: mapped overall_score and formatted analysis_json properly
        resume = ResumeAnalysis(
            user_id=user.id,
            overall_score=random.randint(60, 95),
            analysis_json={"summary": "Generated resume analysis for demo.", "strengths": [], "weaknesses": []}
        )

        db.add(resume)
        db.commit()

    db.close()
    print("Finished seeding 120 candidates.")

if __name__ == "__main__":
    seed_candidates()