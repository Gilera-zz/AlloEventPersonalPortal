-- Add explicit FK from project_interests.user_id -> profiles.id so PostgREST
-- can resolve the embedded select used by the admin applicants list.
-- profiles.id is a 1:1 mirror of auth.users.id, so this FK is always satisfied.
ALTER TABLE public.project_interests
  DROP CONSTRAINT IF EXISTS project_interests_user_id_profiles_fkey;

ALTER TABLE public.project_interests
  ADD CONSTRAINT project_interests_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Make sure a status update by an admin that flips a row to 'confirmed' / back
-- still works when only the admin SELECT policy applies. The existing
-- "admins update interests" policy covers this; we re-assert it here in case
-- a previous environment had it dropped.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_interests'
      AND policyname = 'admins update interests'
  ) THEN
    CREATE POLICY "admins update interests"
      ON public.project_interests FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END$$;
