const BASE_URL = "http://localhost:8000";

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