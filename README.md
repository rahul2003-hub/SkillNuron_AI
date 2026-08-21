# SkillNuron AI - AI-Powered Skill Gap & Career Intelligence Platform

SkillNuron AI is an AI-powered platform designed for job seekers and recruiters. It features skill gap analysis, career path recommendation, ATS resume scoring, psychometric career assessments, and candidate matching using modern machine learning models and FastAPI.

---

## 📁 Project Structure

```
SkillNuron_AI/
├── .git/                                    # Git repository
│
├── backend/                                 # FastAPI Python Backend
│   ├── .env                                # Environment variables
│   ├── .gitignore
│   ├── .python-version                     # Python version configuration
│   ├── pyproject.toml                      # uv project metadata & dependencies
│   ├── uv.lock                             # uv dependency lockfile
│   ├── requirements.txt                    # Python dependencies export
│   ├── Procfile                            # Deployment configuration
│   ├── main.py                             # FastAPI main app entry point
│   ├── database.py                         # PostgreSQL database setup & engine
│   ├── README.md                           # Backend documentation
│   │
│   ├── models/                             # SQLAlchemy Data Models
│   │   ├── __init__.py
│   │   ├── user.py                        # User, profile, & skill models
│   │   ├── job.py                         # Job posting model
│   │   ├── skill.py                       # Skill category model
│   │   └── application.py                 # Job application model
│   │
│   ├── routes/                             # FastAPI Route Handlers
│   │   ├── __init__.py
│   │   ├── auth.py                        # Register & login endpoints
│   │   ├── deps.py                        # JWT authentication & role security dependencies
│   │   ├── profile.py                     # Profile, skill gap, & career path endpoints
│   │   ├── jobs.py                        # Job postings & Adzuna search endpoints
│   │   ├── applications.py                # Job application endpoints
│   │   ├── resume.py                      # Resume upload & AI scoring endpoints
│   │   ├── talent_pool.py                 # Recruiter talent pool endpoints
│   │   ├── psychometric.py                # Psychometric test & AI evaluation endpoints
│   │   ├── recruiter.py                   # Recruiter dashboard endpoints
│   │   └── recruiter_analytics.py         # Recruiter analytics endpoints
│   │
│   ├── services/                           # Business Logic & AI Services
│   │   ├── __init__.py
│   │   ├── ai_service.py                  # Groq AI integration (qwen/qwen3.6-27b)
│   │   ├── auth_services.py               # Authentication helpers
│   │   └── match_services.py              # Candidate & job matching algorithm
│   │
│   ├── scripts/                            # Database & Utility Scripts
│   │   ├── seed_candidates.py             # Seed candidate data
│   │   └── seed_jobs.py                   # Seed job postings
│   │
│   └── tests/                              # Pytest Automated Test Suite
│       ├── __init__.py
│       └── test_api.py                    # Comprehensive API tests
│
├── frontend/                                # React + TypeScript Frontend
│   ├── .gitignore
│   ├── index.html                          # HTML entry point
│   ├── package.json                        # NPM package definition
│   ├── package-lock.json
│   ├── tsconfig.json                       # TypeScript compiler options
│   ├── tsconfig.node.json
│   ├── vite.config.ts                      # Vite build configuration
│   ├── README.md                           # Frontend documentation
│   │
│   └── src/                                 # Frontend Source Code
│       ├── main.tsx                        # React entry point
│       ├── App.tsx                         # Root component & routing
│       ├── index.css                       # Global styles & Tailwind directives
│       │
│       ├── components/                     # Feature Components
│       │   ├── LandingPage.tsx             # Public landing page
│       │   ├── LoginPage.tsx               # Login & authentication UI
│       │   ├── JobSeekerDashboard.tsx      # Job seeker dashboard overview
│       │   ├── JobSeekerLayout.tsx         # Dashboard layout wrapper
│       │   ├── JobRecommendations.tsx      # Recommended job listings
│       │   ├── SkillProfile.tsx            # Skill profile management
│       │   ├── SkillGapAnalysis.tsx        # Interactive AI skill gap report
│       │   ├── CareerPathView.tsx          # Step-by-step career path roadmap
│       │   ├── RecruiterDashboard.tsx      # Recruiter hub & candidate pipeline
│       │   ├── CreateJobPost.tsx           # Job creation form
│       │   ├── PostedJobs.tsx              # Recruiter's posted jobs
│       │   ├── CandidateMatches.tsx        # Matched candidates view
│       │   ├── ResumeAnalyzer.tsx          # Resume ATS analysis tool
│       │   ├── UploadResume.tsx            # PDF resume uploader
│       │   ├── PsychometricTest.tsx        # 15-question career assessment
│       │   └── ui/                         # Reusable UI Component Library
│       │
│       ├── services/                       # API Client Services
│       │   └── api.ts                      # Axios/Fetch API wrapper
│       │
│       └── styles/                         # Style Assets
│           └── globals.css
│
└── README.md                                # Root Project Documentation
```

---

## 💡 Key Features

- 🔐 **Authentication & Authorization**: Secure JWT-based login with role-based access control (`auth.py`, `deps.py`, `auth_services.py`).
- 🤖 **AI-Powered Skill Gap Analysis**: Uses Groq API (`qwen/qwen3.6-27b`) to evaluate user skills against industry standards (`profile.py`, `ai_service.py`).
- 🗺️ **Career Path Recommendations**: Generates tailored career roadmaps with salary estimates and required competencies (`CareerPathView.tsx`).
- 📄 **ATS Resume Analyzer**: Parses PDF resumes using PyMuPDF and scores ATS compatibility with AI suggestions (`resume.py`, `ResumeAnalyzer.tsx`).
- 🧠 **Psychometric Career Assessment**: 15-question personality assessment to map career strengths and roles (`psychometric.py`).
- 💼 **Job Management & Live Search**: Recruiter job creation alongside live job integration via Adzuna API (`jobs.py`, `CreateJobPost.tsx`).
- 📊 **Talent Pool & Recruiter Analytics**: Match score calculations and candidate analytics for recruiters (`talent_pool.py`, `recruiter_analytics.py`).
- ⚡ **Modern Package Management**: Backend managed via `uv` workspace with `pyproject.toml` support.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11.9+, FastAPI, SQLAlchemy, PostgreSQL, Uvicorn, `uv` workspace manager
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **AI/ML Engine**: Groq API (`qwen/qwen3.6-27b`)
- **PDF & Document Parsing**: PyMuPDF (`fitz`)
- **External Data**: Adzuna Job Search API

---

## 🚀 Quick Start Guide

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Set up the virtual environment using `uv` or `venv`:**
   ```bash
   # Using uv (recommended)
   uv sync

   # Or using venv
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables (`.env`):**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/skillneuron_db
   GROQ_API_KEY=your_groq_api_key
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ```

4. **Run Backend Server:**
   ```bash
   uv run uvicorn main:app --reload
   ```
   API Documentation available at: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run Frontend Development Server:**
   ```bash
   npm run dev
   ```
   Application will be running at `http://localhost:5173`.


