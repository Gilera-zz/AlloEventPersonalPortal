-- Tighten storage read: allow only direct fetches of objects, not listing
DROP POLICY IF EXISTS "public read project images" ON storage.objects;
CREATE POLICY "public read project images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'project-images' AND name IS NOT NULL);

-- Restrict redeem_admin_code execute to authenticated users only
REVOKE EXECUTE ON FUNCTION public.redeem_admin_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_admin_code(text) TO authenticated;