-- Admins need to update other users' profiles.role when granting/revoking admin.
-- Without this policy, the admin-role function silently fails to update
-- profiles.role when using a user token instead of the service role key.
CREATE POLICY "admins update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
