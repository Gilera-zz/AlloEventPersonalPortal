-- 1. Extend profiles with new personal/HR fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS special_skills text[],
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS bank_name text;

-- 2. Avatars storage bucket (public read so the URL works in <img>)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of avatar objects
DROP POLICY IF EXISTS "public read avatars" ON storage.objects;
CREATE POLICY "public read avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars' AND name IS NOT NULL);

-- A user can upload/update/delete only files inside their own folder:
-- expected path layout: "<user_id>/<filename>"
DROP POLICY IF EXISTS "users upload own avatar" ON storage.objects;
CREATE POLICY "users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users update own avatar" ON storage.objects;
CREATE POLICY "users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users delete own avatar" ON storage.objects;
CREATE POLICY "users delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. GDPR deletion-request table
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'account_deletion',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes text
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- A user can create and see only their own request(s)
CREATE POLICY "users insert own gdpr request"
ON public.gdpr_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users view own gdpr request"
ON public.gdpr_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and manage all
CREATE POLICY "admins view gdpr requests"
ON public.gdpr_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update gdpr requests"
ON public.gdpr_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete gdpr requests"
ON public.gdpr_requests FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
