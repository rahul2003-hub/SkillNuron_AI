ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS cover_letter TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_salary TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS resume_path TEXT,
  ADD COLUMN IF NOT EXISTS resume_filename TEXT;
