import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, User, LogOut, Menu, X, ShieldCheck, CalendarDays, ListChecks } from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { UserAvatar } from "@/components/UserAvatar";
import { useMyProfile } from "@/hooks/useMyProfile";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { data: profile } = useMyProfile();
  const { t } = useI18n();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: t("nav_start"), icon: Home },
    { to: "/projects", label: t("nav_projects"), icon: Briefcase },
    { to: "/my-projects", label: t("nav_my_projects"), icon: ListChecks },
    { to: "/availability", label: t("nav_availability"), icon: CalendarDays },
    { to: "/profile", label: t("nav_my_page"), icon: User },
    ...(isAdmin ? [{ to: "/admin/projects", label: t("nav_admin"), icon: ShieldCheck }] : []),
  ];

  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const displayName = profile?.full_name?.trim().split(/\s+/)[0] || "User";

  const SidebarInner = (
    <div className="flex h-full flex-col">
      {/* Logo & brand centered */}
      <div className="px-6 py-8 flex flex-col items-center border-b border-white/[0.06]">
        <a href="https://alloevent.se" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          <img src={logo} alt="Allo Event" className="h-10 w-auto" />
        </a>
        <span className="mt-2 text-[10px] font-mono uppercase tracking-[0.35em] text-primary/80">
          PORTAL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {links.map((l) => {
          const active = isActive(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-primary rounded-r-full" />
              )}
              <l.icon
                className={`h-4 w-4 ${active ? "drop-shadow-[0_0_6px_var(--color-primary)]" : ""}`}
                strokeWidth={1.5}
              />
              <span className="font-medium">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: profile + lang + logout */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-1 mb-3">
          <UserAvatar
            url={profile?.avatar_url}
            name={profile?.full_name}
            email={user?.email}
            className="h-8 w-8 ring-1 ring-primary/20"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              {isAdmin ? "Admin" : "Crew"}
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); nav({ to: "/" }); }}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={t("nav_logout")}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <LangToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/[0.06] sticky top-0 h-screen" style={{ backgroundColor: "var(--sidebar-bg)" }}>
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/[0.06] bg-background/85 backdrop-blur flex items-center justify-between px-4">
        <a href="https://alloevent.se" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
          <img src={logo} alt="Allo Event" className="h-7 w-auto" />
        </a>
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/profile" aria-label="Profile" className="rounded-full">
              <UserAvatar
                url={profile?.avatar_url}
                name={profile?.full_name}
                email={user.email}
                className="h-8 w-8 ring-2 ring-primary/40"
              />
            </Link>
          )}
          <Button size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full animate-in slide-in-from-left duration-200" style={{ backgroundColor: "var(--sidebar-bg)" }}>
            <button
              className="absolute top-3 right-3 h-8 w-8 rounded-md hover:bg-white/[0.06] flex items-center justify-center"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {SidebarInner}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div key={path} className="animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
