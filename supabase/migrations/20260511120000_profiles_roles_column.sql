ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';
