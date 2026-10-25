# Recruiter Candidates Search & Filtering Redesign Specification

**Date**: 2026-10-25  
**Target View**: Recruiter Platform -> Candidates (Talent Pool) Tab (`RecruiterCandidates.tsx`)  
**Backend Endpoint**: `GET /recruiter/candidates` in `backend/routes/talent_pool.py`

---

## 1. Goal & Context
Redesign the search and filtering experience on the Recruiter Candidates view into a professional, LinkedIn/Indeed Recruiter-style 280px left-hand sidebar containing seven core filter controls. The filters allow recruiters to swiftly locate talent matching specific keywords, work location types, geographic areas, employment types, experience levels, salary expectations, and activity timeframes.

---

## 2. Requirements & UI Controls

### 2.1 Left-Hand Filter Sidebar (280px wide)
Positioned to the left of the candidate list with a sticky layout:
1. **Keyword Search**:
   - Single query input checking against candidate Name, Email, Job Title / Primary Role (`primary_role`), Target Roles (`target_roles`), Past Companies (extracted from `ResumeAnalysis.analysis_json`), and Skills.
2. **Work Location Type**:
   - Segmented toggle chips: `Remote`, `Hybrid`, `On-site`. Can be toggled on/off.
3. **Geographic Location**:
   - City, State, or Country input field with auto-match against candidate location.
4. **Employment Type**:
   - Checkbox / pill toggles: `Full-time`, `Part-time`, `Contract`, `Internship`, `Temporary`.
5. **Experience Level**:
   - Multi-select level badges:
     - `Entry-level` (0–2 years)
     - `Mid-level` (3–5 years)
     - `Senior` (6–8 years)
     - `Lead / Executive` (8+ years)
6. **Salary Range (Dual-Handle Slider)**:
   - Dual-handle range slider spanning ₹0 LPA to ₹50 LPA+.
   - Displays real-time formatted values: e.g. "₹4L - ₹25L".
   - Includes a checkbox toggle: "Include undisclosed salary" (default: checked).
7. **Date Posted / Active (Quick Filters)**:
   - Radio pill buttons: `Past 24 hours`, `Past week`, `Past month`, `Anytime`.
8. **Clear Filters Action**:
   - A prominent "Reset All Filters" button at top and bottom of sidebar.

### 2.2 Candidate Feed & Active Filters Header
Positioned on the right side of the sidebar:
- Top bar showing total matching candidate count (e.g. "42 candidates found") and "Clear all".
- Active filter chips (e.g., `Remote ✕`, `Full-time ✕`, `3–5 yrs ✕`) allowing quick one-click removal of individual filters.
- Candidate cards enriched with:
  - Candidate name, email, avatar, resume quality score badge.
  - Work location & type badge (e.g., "Mumbai (Hybrid)").
  - Experience level badge (e.g., "Mid-level · 3 years").
  - Expected salary display (e.g. "₹8,00,000 - ₹12,00,000 / yr" or "Undisclosed").
  - Skills pills and "View profile" button.

---

## 3. Backend Implementation (`talent_pool.py`)

### 3.1 Endpoint Parameters
`GET /recruiter/candidates`:
- `search: Optional[str]`
- `location: Optional[str]`
- `work_location_type: Optional[str]` (comma-separated or single: remote, hybrid, on-site)
- `employment_type: Optional[str]` (comma-separated: full-time, part-time, contract, internship, temporary)
- `experience_level: Optional[str]` (comma-separated: entry, mid, senior, lead)
- `salary_min: Optional[int]` (in INR per annum)
- `salary_max: Optional[int]` (in INR per annum)
- `include_undisclosed_salary: bool = True`
- `date_active: Optional[str]` (24h, 7d, 30d, anytime)

### 3.2 Dynamic Candidate Enrichment & Matching
- **Experience Level Mapping**:
  - `0 <= experience_years <= 2` -> `Entry-level`
  - `3 <= experience_years <= 5` -> `Mid-level`
  - `6 <= experience_years <= 8` -> `Senior`
  - `experience_years > 8` -> `Lead / Executive`
- **Work Location Type Inference**:
  - Check candidate location string for keywords ("remote", "hybrid", "wfh", "on-site").
  - Fallback: treat as "On-site" for specific cities (e.g. Mumbai, Pune), or "Hybrid" / "Remote" if specified.
- **Salary Tier Estimation / Match**:
  - If candidate has `expected_salary` recorded in `JobApplication` or profile, parse numeric values.
  - Otherwise, estimate default base pay tier from experience (e.g., 0-2y: ₹4L-₹8L, 3-5y: ₹8L-₹16L, 6-8y: ₹16L-₹28L, 8+y: ₹28L-₹50L) or flag as undisclosed.
  - Filter matches if range overlaps with `[salary_min, salary_max]`.
- **Date Activity Calculation**:
  - Compare `ResumeAnalysis.created_at` or `User.created_at` against UTC now:
    - `24h`: within last 24 hours
    - `7d`: within last 7 days
    - `30d`: within last 30 days
    - `anytime`: no date restriction

---

## 4. Testing & Verification Plan
1. **Automated Testing**:
   - Run backend test suite or verify endpoint via curl/requests with various combinations of search, experience level, salary range, work location, and date filters.
2. **Frontend Build**:
   - Run `npm run build` or Vite typecheck to ensure zero TypeScript errors.
3. **Manual Verification**:
   - Verify 280px left sidebar layout matches dark/light themes cleanly.
   - Verify dual slider adjusts min/max smoothly.
   - Verify filter toggles and active chips update results instantly with 300ms debounce.
