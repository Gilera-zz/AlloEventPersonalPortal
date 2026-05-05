import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";

export function RequireAuth({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
    if (!loading && user && requireAdmin && !isAdmin) nav({ to: "/dashboard" });
  }, [user, loading, isAdmin, requireAdmin, nav]);
  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("loading")}</div>;
  }
  if (requireAdmin && !isAdmin) return null;
  return <AppShell>{children}</AppShell>;
}
