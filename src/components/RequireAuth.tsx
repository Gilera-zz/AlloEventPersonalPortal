import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function RequireAuth({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && requireAdmin && !isAdmin) nav({ to: "/dashboard" });
  }, [user, loading, isAdmin, requireAdmin, nav]);
  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold)" }} />
    </div>
  );
  if (requireAdmin && !isAdmin) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--gold)" }} />
    </div>
  );
  return <>{children}</>;
}
