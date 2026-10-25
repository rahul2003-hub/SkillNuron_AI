ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0
CHECK (experience_years >= 0 AND experience_years <= 60);
