ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS posted_by_id UUID REFERENCES users(id);

UPDATE job_postings jp
SET posted_by_id = u.id
FROM users u
WHERE u.name = jp.posted_by
  AND jp.posted_by_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_job_postings_posted_by_id ON job_postings(posted_by_id);