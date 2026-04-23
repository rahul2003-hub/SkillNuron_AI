const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- SKILL GAP ANALYSIS ---
export async function analyzeSkillGap(userSkills: string[], targetRole: string) {
  const response = await fetch(`${BASE_URL}/api/profile/skill-gap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_skills: userSkills,
      target_role: targetRole,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Skill gap analysis failed");
  }
  return response.json();
}

// --- CAREER PATH ---
export async function getCareerPath(
  userSkills: string[],
  experienceYears: number,
  targetRole: string
) {
  const response = await fetch(`${BASE_URL}/api/profile/career-path`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_skills: userSkills,
      experience_years: experienceYears,
      target_role: targetRole,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Career path fetch failed");
  }
  return response.json();
}

// --- RESUME ANALYZER ---
export async function analyzeResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${BASE_URL}/api/resume/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Resume analysis failed");
  }
  return response.json();
}

// --- JOBS ---
export async function getAllJobs() {
  const response = await fetch(`${BASE_URL}/api/jobs/`);
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return response.json();
}

export async function createJob(job: any) {
  const response = await fetch(`${BASE_URL}/api/jobs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create job");
  }
  return response.json();
}

export async function deleteJob(jobId: string) {
  const response = await fetch(`${BASE_URL}/api/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete job");
  return response.json();
}

// --- RESUME ANALYZE FROM PASTED TEXT (fallback) ---
export async function analyzeResumeFromText(resumeText: string) {
  const response = await fetch(`${BASE_URL}/api/resume/analyze-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Resume analysis failed");
  }
  return response.json();
}

// --- SKILLS ---
export async function saveSkills(userId: string, skills: any[]) {
  const response = await fetch(`${BASE_URL}/api/profile/skills/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, skills }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to save skills");
  }
  return response.json();
}

export async function getSkills(userId: string) {
  const response = await fetch(`${BASE_URL}/api/profile/skills/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch skills");
  return response.json();
}

// --- ADZUNA REAL INDIAN JOBS ---
export async function searchJobs(keywords: string = "software developer", location: string = "Mumbai", results: number = 10) {
  const params = new URLSearchParams({ keywords, location, results: results.toString() });
  const response = await fetch(`${BASE_URL}/api/jobs/search?${params}`);
  if (!response.ok) throw new Error("Failed to fetch jobs from Adzuna");
  return response.json();
}

// --- USER PROFILE ---
export async function getProfile(userId: string) {
  const response = await fetch(`${BASE_URL}/api/profile/info/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateProfile(userId: string, profileData: any) {
  const response = await fetch(`${BASE_URL}/api/profile/info/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, ...profileData }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update profile");
  }
  return response.json();
}

export async function getSkillSuggestions() {
  const response = await fetch(`${BASE_URL}/api/profile/skill-suggestions`);
  if (!response.ok) throw new Error("Failed to fetch skill suggestions");
  return response.json();
}

// --- RECRUITER DASHBOARD & ANALYTICS ---
export async function getRecruiterDashboard() {
  const response = await fetch(`${BASE_URL}/recruiter/dashboard`);
  if (!response.ok) throw new Error("Failed to fetch recruiter dashboard");
  return response.json();
}

export async function getRecruiterAnalytics() {
  const response = await fetch(`${BASE_URL}/recruiter/analytics`);
  if (!response.ok) throw new Error("Failed to fetch recruiter analytics");
  return response.json();
}

// --- TALENT POOL & MATCHING ---
export async function getCandidates(skill?: string) {
  const url = skill
    ? `${BASE_URL}/recruiter/candidates?skill=${skill}`
    : `${BASE_URL}/recruiter/candidates`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch candidates");
  return response.json();
}

export async function getCandidateMatches(jobId: string) {
  const response = await fetch(`${BASE_URL}/recruiter/job/${jobId}/matches`);
  if (!response.ok) throw new Error("Failed to fetch candidate matches");
  return response.json();
}