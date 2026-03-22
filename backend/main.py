from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
from models.user import User, UserProfile, UserSkill, ResumeAnalysis
from models.skill import SkillCategory
from models.job import JobPosting
Base.metadata.create_all(bind=engine)

from routes.auth import router as auth_router
from routes.resume import router as resume_router
from routes.profile import router as profile_router
from routes.jobs import router as jobs_router
from routes.psychometric import router as psychometric_router

app = FastAPI(
    title="SkillNeuron AI API",
    description="AI-powered Skill Gap Analyzer and Career Path Recommender",
    version="1.0.0"
)

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://skillneuron-frontend.onrender.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Regeister all routes
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(profile_router)
app.include_router(jobs_router)
app.include_router(psychometric_router)

@app.get("/")
def root():
    return {"message": "SkillNeuron AI backend is running! 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
