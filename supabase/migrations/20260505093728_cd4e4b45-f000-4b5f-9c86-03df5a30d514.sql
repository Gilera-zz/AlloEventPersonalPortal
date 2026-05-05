-- 1. Add image_url to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Create project-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "public read project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Admins can upload/update/delete
CREATE POLICY "admins upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update project images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete project images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

-- 3. Admin codes table
CREATE TABLE public.admin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage codes
CREATE POLICY "admins manage admin codes"
ON public.admin_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Redemption function (security definer to bypass RLS for the lookup/upgrade)
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

  RETURN true;
END;
$$;

-- 5. Seed initial code
INSERT INTO public.admin_codes (code) VALUES ('ALLO-ADMIN-2026')
ON CONFLICT (code) DO NOTHING;

-- 6. Add status check options note: keep status as text; valid values: interested, confirmed, declined