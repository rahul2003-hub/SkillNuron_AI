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
│   ├── deps.py                             # Supabase auth verification & role dependencies
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
│   ├── .env                                # Frontend environment variables
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
│       ├── services/                       # API & Integration Services
│       │   ├── api.ts                      # Axios/Fetch API wrapper
│       │   └── supabase.ts                 # Supabase client instance
│       │
│       └── styles/                         # Style Assets
│           └── globals.css
│
├── supabase/                                # Supabase CLI & database migrations
│   └── migrations/                         # SQL schema migration scripts
│
└── README.md                                # Root Project Documentation
```

---

## 💡 Key Features

- 🔐 **Authentication & Authorization**: Supabase Auth integration with FastAPI dependency checks and role-based access control (`deps.py`, `supabase.ts`).
- 🤖 **AI-Powered Skill Gap Analysis**: Uses Groq API (`qwen/qwen3.6-27b`) to evaluate user skills against industry standards (`profile.py`, `ai_service.py`).
- 🗺️ **Career Path Recommendations**: Generates tailored career roadmaps with salary estimates and required competencies (`CareerPathView.tsx`).
- 📄 **ATS Resume Analyzer**: Parses PDF resumes using PyMuPDF and scores ATS compatibility with AI suggestions (`resume.py`, `ResumeAnalyzer.tsx`).
- 🧠 **Psychometric Career Assessment**: 15-question personality assessment to map career strengths and roles (`psychometric.py`).
- 💼 **Job Management & Live Search**: Recruiter job creation alongside live job integration via Adzuna API (`jobs.py`, `CreateJobPost.tsx`).
- 📊 **Talent Pool & Recruiter Analytics**: Match score calculations and candidate analytics for recruiters (`talent_pool.py`, `recruiter_analytics.py`).
- ⚡ **Modern Package Management**: Backend managed via `uv` workspace with `pyproject.toml` support.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11.9+, FastAPI, SQLAlchemy, PostgreSQL (Supabase), Uvicorn, `uv` workspace manager
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Authentication**: Supabase Auth
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
   DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   SUPABASE_URL=https://your_supabase_project_id.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_APP_KEY=your_adzuna_app_key
   ```

4. **Run Backend Server:**
   ```bash
   uv run uvicorn main:app --reload
   ```
   API Documentation available at: `http://localhost:8000/docs`

### Database Migrations (Supabase CLI)
 ```bash
1. Install Supabase CLI globally (if not installed):
   npm install -g supabase

2. Log in to Supabase CLI:
   supabase login

3. Link project:
   supabase link

4. Push migrations to remote database:
   supabase db push

5. Create a new migration file:
   supabase migration new <migration_name>
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`):**
   ```env
   VITE_SUPABASE_URL=https://your_supabase_project_id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Run Frontend Development Server:**
   ```bash
   npm run dev
   ```
   Application will be running at `http://localhost:5173`.


---

## Recent additions

- **Application tracking & notifications**: Job seekers can apply to posted jobs, monitor application statuses, and receive in-app notifications when recruiters update a status.
- **Recruiter workflow upgrades**: Recruiters can access analytics, view candidate matches, and use AI to polish job-description drafts before posting.
- **Resume continuity**: Resume analyses are saved as history; uploaded PDFs can be stored in Supabase Storage and retrieved through temporary signed links.
- **Centralized catalog data**: The backend provides shared cities, roles, education fields, application statuses, and skill buckets for frontend selectors.

---

## Recent additions backend

### Application tracking and notifications

- `POST /applications/apply/{job_id}` applies to a posted job.
- `GET /applications/my` returns the current user's applications.
- `GET /applications/job/{job_id}` and `PATCH /applications/{application_id}/status` support recruiter application management.
- Statuses are `applied`, `shortlisted`, `rejected`, and `hired`; updating one creates a candidate notification.
- `GET /applications/notifications` and `POST /applications/notifications/mark-read` manage in-app notifications.

### Recruiter, catalog, and resume enhancements

- `GET /recruiter/analytics` exposes recruiter dashboard metrics and chart data; recruiter candidate matches remain available at `GET /recruiter/job/{job_id}/matches`.
- `POST /api/jobs/polish-description` uses AI to polish a job-description draft, and `GET /api/jobs/mine` returns only the authenticated recruiter's job postings.
- `GET /api/profile/catalog` provides shared cities, roles, education fields, application statuses, and skill buckets. `GET /api/profile/dashboard` provides the job-seeker dashboard summary.
- `GET /api/profile/resume/history/{user_id}` returns saved resume analyses. When Supabase Storage is configured, PDF uploads are retained and can be accessed with `GET /api/resume/download/{resume_path}`.
- To enable PDF storage, add `SUPABASE_SERVICE_KEY=your_supabase_service_role_key` and optionally `SUPABASE_RESUME_BUCKET=resumes` to `.env`.
- Job ownership uses the authenticated recruiter's user-ID foreign key, preventing another recruiter from managing a job or its application statuses.

---

## Recent additions frontend

- The job-seeker dashboard now includes a home overview, **My Applications** status tracking, and an in-app notification bell for recruiter status updates.
- Recruiters now have analytics charts, AI job-description polishing, and job lists scoped to the authenticated recruiter.
- The frontend uses backend-provided catalog values for shared selector data, including roles, cities, education fields, and skill buckets.
- Resume analysis history is available alongside optional stored-PDF download links when backend storage is configured.

---

# Running Tests in backend directory
```bash
  cd backend
  pytest tests/test_applications.py tests/test_profile_dashboard.py -v
```