-- The has_role() function only checked user_roles, but the app also promotes
-- admins via profiles.role. This mismatch caused RLS to block admin queries
-- (e.g. viewing all applicants) when the profiles.role column was set but no
-- matching row existed in user_roles. Update has_role() to check both.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
  OR (
    _role = 'admin' AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin'
    )
  )
$$;

-- Also update redeem_admin_code to set profiles.role so both sources stay in sync.
CREATE OR REPLACE FUNCTION public.redeem_admin_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_id FROM public.admin_codes
   WHERE code = _code AND active = true AND used_by IS NULL
   LIMIT 1;

  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.admin_codes
     SET used_by = v_user, used_at = now(), active = false
   WHERE id = v_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles SET role = 'admin' WHERE id = v_user;

  RETURN true;
END;
$$;
