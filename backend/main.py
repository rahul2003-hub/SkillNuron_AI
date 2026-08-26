from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from models.skill import SkillCategory
from models.job import JobPosting
from models.application import JobApplication, Notification
Base.metadata.create_all(bind=engine)

from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.profile import router as profile_router
from routes.jobs import router as jobs_router
from routes.psychometric import router as psychometric_router
from routes.recruiter import router as recruiter_router
from routes.talent_pool import router as talent_router 
from routes.applications import router as applications_router
from routes.recruiter_analytics import router as recruiter_analytics_router

app = FastAPI(
    title="SkillNuron AI API",
    description="AI-powered Skill Gap Analyzer and Career Path Recommender",
    version="1.0.0"
)

# Allow frontend to talk to backend (including Vercel preview deployments)
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://skillnuron-ai.vercel.app",
    "https://skillnuron-ai-git-main-rahulpanchal5003-1733s-projects.vercel.app",
    "https://skillnuron-8llptdhqr-rahulpanchal5003-1733s-projects.vercel.app",
]

env_origins = os.getenv("CORS_ORIGINS", "")
allow_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

if env_origins == "*":
    allowed_origins = ["*"]
    allow_origin_regex = r".*"
elif env_origins:
    extra_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
    allowed_origins = list(set(default_origins + extra_origins))
else:
    allowed_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

#Regeister all routes
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(profile_router)
app.include_router(jobs_router)
app.include_router(psychometric_router)
app.include_router(recruiter_router) 
app.include_router(talent_router)
app.include_router(applications_router)
app.include_router(recruiter_analytics_router)

@app.get("/")
def root():
    return {"message": "SkillNuron AI backend is running! 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
