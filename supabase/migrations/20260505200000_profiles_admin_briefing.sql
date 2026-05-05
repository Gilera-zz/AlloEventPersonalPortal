-- Profile fields for self-presentation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills text[],
  ADD COLUMN IF NOT EXISTS experience text;

-- Backfill from legacy column if data exists
UPDATE public.profiles
SET skills = special_skills
WHERE skills IS NULL AND special_skills IS NOT NULL;

-- Briefing text shown on the project page only to confirmed staff
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS staff_instructions text;

-- Confirmed users (status = 'confirmed') need to read the project's
-- staff_instructions even though base SELECT is on projects table for all
-- authenticated users — the existing policy already allows that, so no extra
-- policy is required here.
