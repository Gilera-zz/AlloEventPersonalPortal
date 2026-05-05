-- Mirror the manual SQL that was already applied in production.
-- profiles.role lets admins be promoted directly in the profiles row, which is
-- how the app now decides whether to show the admin tab.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

-- Helpful index for the auth-time admin lookup.
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role)
  WHERE role IS NOT NULL;

-- Backfill from the legacy user_roles table so anyone previously promoted via
-- redeem_admin_code stays an admin under the new check.
UPDATE public.profiles p
SET role = 'admin'
WHERE role IS DISTINCT FROM 'admin'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'admin'
  );
