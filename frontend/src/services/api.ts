import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getHeaders(extraHeaders: Record<string, string> = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export async function syncUserWithBackend(name: string, userType: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/auth/sync`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, user_type: userType }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "User synchronization failed");
  }
  return response.json();
}

// --- SKILL GAP ANALYSIS ---
export async function analyzeSkillGap(userSkills: string[], targetRole: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/skill-gap`, {
    method: "POST",
    headers,
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
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/career-path`, {
    method: "POST",
    headers,
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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/resume/analyze`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Resume analysis failed");
  }
  return response.json();
}

export async function saveResumeAnalysis(overallScore: number, analysisJson: any, resumePath?: string | null, filename?: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/resume/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({ overall_score: overallScore, analysis_json: analysisJson, resume_path: resumePath, filename }),
  });
  if (!response.ok) throw new Error("Failed to save resume analysis");
  return response.json();
}

export async function getResumeHistory(userId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/resume/history/${userId}`, { headers });
  if (!response.ok) throw new Error("Failed to fetch resume history");
  return response.json();
}

export async function getResumeDownloadUrl(resumePath: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/resume/download/${resumePath}`, { headers });
  if (!response.ok) throw new Error("Failed to get download link");
  return response.json();
}

// --- JOBS ---
export async function getAllJobs() {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/jobs/`, { headers });
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return response.json();
}

export async function createJob(job: any) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/jobs/`, {
    method: "POST",
    headers,
    body: JSON.stringify(job),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create job");
  }
  return response.json();
}

export async function deleteJob(jobId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/jobs/${jobId}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error("Failed to delete job");
  return response.json();
}

// --- RESUME ANALYZE FROM PASTED TEXT ---
export async function analyzeResumeFromText(resumeText: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/resume/analyze-text`, {
    method: "POST",
    headers,
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
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/skills/save`, {
    method: "POST",
    headers,
    body: JSON.stringify({ skills }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to save skills");
  }
  return response.json();
}

export async function getSkills(userId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/skills/${userId}`, { headers });
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
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/info/${userId}`, { headers });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
}

export async function updateProfile(userId: string, profileData: any) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/profile/info/update`, {
    method: "POST",
    headers,
    body: JSON.stringify(profileData),
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
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/recruiter/dashboard`, { headers });
  if (!response.ok) throw new Error("Failed to fetch recruiter dashboard");
  return response.json();
}

export async function getRecruiterAnalytics() {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/recruiter/analytics`, { headers });
  if (!response.ok) throw new Error("Failed to fetch recruiter analytics");
  return response.json();
}

// --- TALENT POOL & MATCHING ---
export async function getCandidates(skill?: string) {
  const headers = await getHeaders();
  const url = skill
    ? `${BASE_URL}/recruiter/candidates?skill=${skill}`
    : `${BASE_URL}/recruiter/candidates`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("Failed to fetch candidates");
  return response.json();
}

export async function getCandidateMatches(jobId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/recruiter/job/${jobId}/matches`, { headers });
  if (!response.ok) throw new Error("Failed to fetch candidate matches");
  return response.json();
}

// --- APPLICATIONS ---
export async function applyToJob(jobId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/apply/${jobId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to apply");
  }
  return response.json();
}

export async function getMyApplications() {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/my`, { headers });
  if (!response.ok) throw new Error("Failed to fetch applications");
  return response.json();
}

export async function getJobApplications(jobId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/job/${jobId}`, { headers });
  if (!response.ok) throw new Error("Failed to fetch job applications");
  return response.json();
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/${applicationId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update status");
  }
  return response.json();
}

export async function getJobApplicationTimeseries(jobId: string) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/job/${jobId}/timeseries`, { headers });
  if (!response.ok) throw new Error("Failed to fetch application timeseries");
  return response.json();
}

// --- NOTIFICATIONS ---
export async function getNotifications() {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/notifications`, { headers });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function markNotificationsRead() {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/applications/notifications/mark-read`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error("Failed to mark notifications read");
  return response.json();
}

// --- JD POLISHER ---
export async function polishJobDescription(title: string, description: string, requiredSkills: string[]) {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}/api/jobs/polish-description`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, description, required_skills: requiredSkills }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to polish description");
  }
  return response.json();
}