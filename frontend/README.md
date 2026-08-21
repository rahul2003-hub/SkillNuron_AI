# SkillNeuron AI — Frontend

> AI-powered Skill Gap Analyzer and Career Path Recommender System  
> MCA Final Year Project | Built with React + TypeScript + Vite

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| HTTP Client | Native Fetch API |
| Routing | State-based (useState) |

---

## 📁 Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
│
└── src/
    ├── App.tsx                      # Root component + global state
    ├── main.tsx                     # React entry point
    ├── index.css                    # Global styles
    │
    ├── services/
    │   └── api.ts                   # All backend API calls (single source)
    │
    └── components/
        ├── LandingPage.tsx          # Home page with user type selection
        ├── LoginPage.tsx            # Login + Register with real backend auth
        ├── JobSeekerDashboard.tsx   # Main dashboard — 6 tabs
        ├── RecruiterDashboard.tsx   # Recruiter dashboard — 3 tabs
        │
        ├── SkillProfile.tsx         # Profile: Basic Info + Skills + Links
        ├── SkillGapAnalysis.tsx     # AI skill gap analysis
        ├── CareerPathView.tsx       # AI career path recommender
        ├── ResumeAnalyzer.tsx       # PDF upload + AI resume scoring
        ├── JobRecommendations.tsx   # Live Indian jobs via Adzuna
        ├── PsychometricTest.tsx     # 15-question career assessment
        │
        ├── CreateJobPost.tsx        # Recruiter: post new job
        ├── PostedJobs.tsx           # Recruiter: view/delete jobs
        ├── CandidateMatches.tsx     # Recruiter: AI candidate matching
        │
        └── ui/                      # shadcn/ui base components
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:8000`

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/SkillNuronAI-frontend.git
cd SkillNuronAI-frontend/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

App runs at: `http://localhost:5173`

---

## 🔌 Backend Connection

All API calls are centralised in `src/services/api.ts`.

To change the backend URL (e.g. after deploying to Render), update this single line:

```typescript
// src/services/api.ts
const BASE_URL = "http://localhost:8000"; // change this for production
```

---

## 📱 App Features

### Job Seeker Dashboard (6 tabs)

| Tab | Feature |
|-----|---------|
| Profile | Basic info, education, target role, skills, GitHub/LinkedIn |
| Assessment | 15-question psychometric test → AI career personality profile |
| Resume Analyzer | PDF upload → AI scoring (ATS, keywords, improvements) |
| Gap Analysis | Enter target role → AI finds missing skills + learning plan |
| Career Path | Skills + experience → AI roadmap with ₹ Indian salaries |
| Jobs | Live Indian job listings from Adzuna (Mumbai/Bangalore/Pune) |

### Recruiter Dashboard (3 tabs)

| Tab | Feature |
|-----|---------|
| My Jobs | View and delete posted jobs |
| Post Job | Create new job posting saved to PostgreSQL |
| Candidates | AI-powered candidate matching |

---

## 🎨 Design System

- **Primary colors:** Purple (`#7C3AED`) → Pink (`#DB2777`) gradient
- **Background:** Light blue-purple gradient (`from-blue-50 via-purple-50 to-pink-50`)
- **Cards:** White with `rounded-xl shadow-sm`
- **Buttons:** Gradient purple-to-pink with hover shadow
- **Typography:** System default sans-serif

---

## 🔑 Authentication Flow

```
LandingPage
    → Select user type (Job Seeker / Recruiter)
    → LoginPage (Login or Register)
    → POST /api/auth/login or /api/auth/register
    → JWT token stored in localStorage
    → user_id passed through app via React state
    → Dashboard renders based on user_type
```

---

## 📦 Build for Production

```bash
npm run build
```

Output in `dist/` folder — ready to deploy to Vercel, Netlify or Render.

---

## 🚀 Deployment (Render.com / Vercel)

### Vercel (recommended for frontend)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Set framework: Vite
4. Set environment variable: `VITE_API_URL=your-render-backend-url`
5. Deploy!

### Update API URL after deployment
```typescript
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

---

## 🧩 Key Components Explained

### `api.ts` — Central API Layer
Single file for all backend communication. Never write `fetch()` directly in components.

### `JobSeekerDashboard.tsx` — State Management
Holds the shared `skills` state that flows down to Profile, Gap Analysis and Career Path tabs via props.

### `PsychometricTest.tsx` — Assessment Flow
3 screens: Welcome → Questions (with dot navigation) → Results. Auto-advances after each answer. Minimum 10 answers required to submit.

### `JobRecommendations.tsx` — Live Data
Fetches real jobs from Adzuna India API via backend. Dropdown for role + city. Auto-searches on load.

---

## 👨‍💻 Author

**Rahul Panchal**  
MCA Final Year | Skillneuron AI  
GitHub: [github.com/rahul2025-hub](https://github.com/rahul2025-hub)

---

## 📄 License

This project is built for academic purposes as an MCA final year project.