-- Existing API clients historically create published jobs without sending a
-- lifecycle status.  Preserve that behavior while the recruiter UI can still
-- explicitly create drafts.
ALTER TABLE job_postings ALTER COLUMN status SET DEFAULT 'open';
