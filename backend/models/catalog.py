"""Single source of truth for dropdown/catalog data and skill classification
used across the frontend. Replaces hardcoded TS constants in
SkillProfile.tsx, JobRecommendations.tsx, and PostedJobs.tsx.

Save as: backend/models/catalog.py
"""

INDIAN_CITIES = [
    "Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi",
    "Noida", "Chennai", "Navi Mumbai", "Kolkata", "Ahmedabad"
]

TECH_ROLES = [
    "Python Developer", "Full Stack Developer", "Frontend Developer",
    "Backend Developer", "Data Scientist", "ML Engineer",
    "DevOps Engineer", "React Developer", "Java Developer",
    "Software Engineer", "Cloud Engineer", "QA Engineer"
]

TARGET_ROLES = [
    "Full Stack Developer", "Frontend Developer", "Backend Developer",
    "Data Scientist", "ML Engineer", "DevOps Engineer",
    "Mobile Developer", "Cloud Engineer", "Cybersecurity Analyst",
    "UI/UX Designer", "Product Manager", "QA Engineer"
]

APPLICATION_STATUSES = ["applied", "shortlisted", "rejected", "hired"]

EDUCATION_LEVELS = ["BCA", "MCA", "B.Tech", "M.Tech", "B.Sc", "M.Sc", "BE", "ME", "Diploma", "Other"]
EDUCATION_STATUSES = ["Completed", "Pursuing"]
CURRENT_STATUSES = ["Student", "Fresher", "Working Professional"]

# --- Skill bucket classification (moved from SkillProfile.tsx) ---
CORE_CATEGORIES = {"Programming", "Frontend", "Backend"}
EMERGING_CATEGORIES = {"AI & Data", "DevOps & Cloud"}
# Everything else (Database, Tools, custom categories) => "Secondary"

BUCKET_ORDER = ["Core", "Secondary", "Emerging & Tools"]

KEYWORD_FALLBACKS = [
    (("react", "vue", "angular", "next", "html", "css", "tailwind", "bootstrap", "figma", "redux", "graphql"), "Frontend"),
    (("fastapi", "django", "flask", "node", "express", "spring", "rest api", "microservice", "websocket"), "Backend"),
    (("postgres", "mysql", "mongo", "redis", "sqlite", "elasticsearch", "firebase", "supabase", "sql", "nosql"), "Database"),
    (("docker", "kubernetes", "aws", "azure", "gcp", "google cloud", "ci/cd", "github actions", "terraform", "linux", "nginx"), "DevOps & Cloud"),
    (("machine learning", "deep learning", "tensorflow", "pytorch", "scikit", "pandas", "numpy", "data analysis", "langchain", "hugging face", "power bi", "tableau"), "AI & Data"),
    (("git", "jira", "postman", "vs code", "notion", "slack", "bash"), "Tools"),
]


def get_bucket(category: str) -> str:
    """Map a skill category into one of the 3 recruiter-facing buckets."""
    if category in CORE_CATEGORIES:
        return "Core"
    if category in EMERGING_CATEGORIES:
        return "Emerging & Tools"
    return "Secondary"


def auto_categorize(skill_name: str, suggestions: dict) -> str:
    """Match a typed skill name against SKILL_SUGGESTIONS (case-insensitive),
    falling back to keyword rules, else default to 'Programming'.
    """
    trimmed = skill_name.strip().lower()

    for category, skill_list in suggestions.items():
        if any(s.lower() == trimmed for s in skill_list):
            return category

    for keywords, category in KEYWORD_FALLBACKS:
        if any(kw in trimmed for kw in keywords):
            return category

    return "Programming"


def get_catalog() -> dict:
    """Everything the frontend needs for selects/dropdowns, in one payload."""
    known_categories = CORE_CATEGORIES | EMERGING_CATEGORIES | {
        "Database", "Tools"
    }
    category_bucket_map = {cat: get_bucket(cat) for cat in sorted(known_categories)}

    return {
        "cities": INDIAN_CITIES,
        "tech_roles": TECH_ROLES,
        "target_roles": TARGET_ROLES,
        "application_statuses": APPLICATION_STATUSES,
        "education_levels": EDUCATION_LEVELS,
        "education_statuses": EDUCATION_STATUSES,
        "current_statuses": CURRENT_STATUSES,
        "bucket_order": BUCKET_ORDER,
        "category_bucket_map": category_bucket_map,  # e.g. {"Programming": "Core", ...}
    }