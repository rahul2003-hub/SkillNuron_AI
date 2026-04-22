from faker import Faker
import random
import uuid
import sys
import os

# Adjusted import path so the script runs properly from the backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.job import JobPosting

fake = Faker()

job_titles = [
    "Backend Developer", "Frontend Developer", "Full Stack Developer",
    "Machine Learning Engineer", "Data Scientist", "DevOps Engineer",
    "Software Engineer",
]

skills_pool = [
    "Python", "FastAPI", "React", "Node.js", "SQL", "Docker",
    "AWS", "Machine Learning", "TensorFlow", "PyTorch",
    "Java", "Spring Boot", "TypeScript", "Next.js",
]

locations = [
    "Mumbai", "Pune", "Navi Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai"
]

companies = [
    "TCS", "Infosys", "Wipro", "Capgemini", "Accenture", "Zoho", "Freshworks",
]

job_types = ["Full-time", "Part-time", "Contract", "Remote"]

def seed_jobs():
    db = SessionLocal()
    print("Seeding jobs...")

    for _ in range(25):
        # FIXED: mapped correct columns (salary, required_skills, type)
        # FIXED: passed a list to the ARRAY column instead of a joined string
        job = JobPosting(
            id=uuid.uuid4(),
            title=random.choice(job_titles),
            company=random.choice(companies),
            location=random.choice(locations),
            type=random.choice(job_types),
            salary=f"{random.randint(4,12)} LPA",
            required_skills=random.sample(skills_pool, random.randint(3, 5)),
            description=fake.text(max_nb_chars=200),
            posted_by="system_seed"
        )

        db.add(job)

    db.commit()
    db.close()
    print("Finished seeding 25 jobs.")

if __name__ == "__main__":
    seed_jobs()