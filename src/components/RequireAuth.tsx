import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && requireAdmin && !isAdmin) nav({ to: "/dashboard" });
  }, [user, loading, isAdmin, requireAdmin, nav]);
  if (loading || !user) return null;
  if (requireAdmin && !isAdmin) return null;
  return <>{children}</>;
}
