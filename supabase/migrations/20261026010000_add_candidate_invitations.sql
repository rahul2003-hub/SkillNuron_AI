ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct';

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT uq_invitation_job_candidate UNIQUE (job_id, candidate_id)
);
