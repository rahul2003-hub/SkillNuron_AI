ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS openings INTEGER NOT NULL DEFAULT 1;
-- Existing published posts predate lifecycle support, so retain their visibility.
UPDATE job_postings SET status = 'open' WHERE status = 'draft';

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  scheduled_by_user_id UUID NOT NULL REFERENCES users(id),
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
