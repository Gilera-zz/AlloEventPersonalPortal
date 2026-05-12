export function isProfileComplete(profile: {
  email?: string | null;
  phone?: string | null;
  roles?: string[] | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return (
    !!profile.email?.trim() &&
    !!profile.phone?.trim() &&
    Array.isArray(profile.roles) &&
    profile.roles.length > 0
  );
}
