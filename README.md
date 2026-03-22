# SkillNeuron AI — Backend

> AI-powered Skill Gap Analyzer and Career Path Recommender System  
> MCA Final Year Project | Built with FastAPI + PostgreSQL + Groq AI

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (Python) |
| AI Engine | Groq API — Llama 3.3 70B |
| Database | PostgreSQL + SQLAlchemy |
| Authentication | JWT (python-jose) + bcrypt |
| PDF Parsing | PyMuPDF (fitz) |
| Job Data | Adzuna API (Indian job market) |
| Testing | Pytest + httpx |
| Deployment | Render.com |

---

## 📁 Project Structure

```
backend/
├── main.py                  # FastAPI app entry point
├── database.py              # PostgreSQL connection + session
├── requirements.txt         # Python dependencies
├── Procfile                 # Render deployment config
├── .env                     # Environment variables (never commit)
│
├── models/
│   ├── user.py              # User, UserProfile, UserSkill, ResumeAnalysis
│   ├── job.py               # JobPosting
│   └── skill.py             # SkillCategory + SKILL_SUGGESTIONS
│
├── routes/
│   ├── auth.py              # Register, Login (JWT)
│   ├── profile.py           # Profile CRUD + AI skill gap + career path
│   ├── resume.py            # PDF upload + AI resume analysis
│   ├── jobs.py              # Job CRUD + Adzuna live search
│   └── psychometric.py      # 15-question career assessment
│
├── services/
│   ├── ai_service.py        # All Groq AI functions
│   ├── auth_services.py     # Auth helpers
│   └── match_services.py    # Job matching logic
│
└── tests/
    └── test_api.py          # 16 automated API tests
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.12+
- PostgreSQL installed and running
- Groq API key (free at console.groq.com)
- Adzuna API credentials (free at developer.adzuna.com)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/SkillNuron_AI.git
cd SkillNuron_AI
git checkout backend
cd backend
```

### 2. Create virtual environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create PostgreSQL database
```sql
CREATE DATABASE skillneuron_db;
```

### 5. Configure environment variables
Create a `.env` file in the `backend/` folder:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/skillneuron_db
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

### 6. Run the server
```bash
uvicorn main:app --reload
```

Server runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Login credentials + user type |
| `user_profiles` | Education, target role, location, links |
| `user_skills` | Skills with proficiency level per user |
| `job_postings` | Recruiter-posted jobs |
| `resume_analyses` | AI resume scores saved per user |

Tables are created **automatically** on first server start via SQLAlchemy.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login + get JWT token |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/info/{user_id}` | Get full profile |
| POST | `/api/profile/info/update` | Update profile info |
| POST | `/api/profile/skills/save` | Save skills to DB |
| GET | `/api/profile/skills/{user_id}` | Get user skills |
| GET | `/api/profile/skill-suggestions` | Autocomplete skill list |
| POST | `/api/profile/skill-gap` | AI skill gap analysis |
| POST | `/api/profile/career-path` | AI career path recommendation |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/analyze` | Upload PDF + AI analysis |
| POST | `/api/resume/analyze-text` | Paste text + AI analysis |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/` | Get all recruiter jobs |
| POST | `/api/jobs/` | Create job posting |
| DELETE | `/api/jobs/{id}` | Delete job posting |
| POST | `/api/jobs/match` | AI job matching |
| GET | `/api/jobs/search` | Live Adzuna Indian jobs |

### Psychometric
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/psychometric/questions` | Get 15 assessment questions |
| POST | `/api/psychometric/analyze` | AI personality + career profile |

---

## 🧪 Running Tests

```bash
pytest tests/test_api.py -v -s
```

Expected: **16 passed, 0 warnings**

---

## 🤖 AI Features

All AI features use **Groq API with Llama 3.3 70B** model:

- **Skill Gap Analysis** — compares user skills vs target role, returns missing skills with priority, learning resources, action plan
- **Career Path** — builds step-by-step roadmap with ₹ Indian salaries and city demand
- **Resume Analysis** — scores ATS compatibility, content quality, keywords, suggests improvements
- **Psychometric Assessment** — 15 tech career questions mapped to personality type + top 3 career role matches with Indian company suggestions

---

## 🚀 Deployment (Render.com)

1. Push code to GitHub (`backend` branch)
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from `.env`
7. Deploy!

---

## 👨‍💻 Author

**Rahul Panchal**  
MCA Final Year | Skillneuron AI  
GitHub: [github.com/rahul2025-hub](https://github.com/rahul2025-hub)

---

## 📄 License

This project is built for academic purposes as an MCA final year project.
