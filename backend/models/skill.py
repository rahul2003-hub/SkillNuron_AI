from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid


class SkillCategory(Base):
    """Reference table — predefined skill suggestions per category"""
    __tablename__ = "skill_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String, nullable=False)
    skill_name = Column(String, nullable=False)


# Predefined skills used for autocomplete suggestions in Profile
SKILL_SUGGESTIONS = {
    "Programming": [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#",
        "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin"
    ],
    "Frontend": [
        "React", "Angular", "Vue.js", "Next.js", "HTML/CSS",
        "Tailwind CSS", "Bootstrap", "Figma", "Redux", "GraphQL"
    ],
    "Backend": [
        "FastAPI", "Django", "Flask", "Node.js", "Express.js",
        "Spring Boot", "REST APIs", "Microservices", "WebSockets"
    ],
    "Database": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
        "Elasticsearch", "Firebase", "Supabase", "SQL", "NoSQL"
    ],
    "DevOps & Cloud": [
        "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud",
        "CI/CD", "GitHub Actions", "Terraform", "Linux", "Nginx"
    ],
    "AI & Data": [
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "Scikit-learn", "Pandas", "NumPy", "Data Analysis",
        "LangChain", "Hugging Face", "Power BI", "Tableau"
    ],
    "Tools": [
        "Git", "GitHub", "Jira", "Postman", "VS Code",
        "Figma", "Notion", "Slack", "Linux", "Bash"
    ]
}