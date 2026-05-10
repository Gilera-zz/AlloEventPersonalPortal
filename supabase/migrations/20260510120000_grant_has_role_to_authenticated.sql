-- Migration 20260504202732 revoked EXECUTE on has_role from all roles,
-- including authenticated. This broke every RLS policy that calls has_role()
-- (admin view of interests, profiles, projects, availability, etc.) because
-- PostgreSQL requires the calling role to have EXECUTE even when the function
-- is SECURITY DEFINER. Re-grant to authenticated so admin RLS policies work.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
