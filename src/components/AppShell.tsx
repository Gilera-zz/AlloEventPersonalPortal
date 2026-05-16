import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, Briefcase, User, LogOut, Menu, X, ShieldCheck, CalendarDays, ListChecks, Users, Settings2, Bell } from "lucide-react";
import logo from "@/assets/allo-logo.png";
import { UserAvatar } from "@/components/UserAvatar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useUnreadCount } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/NotificationBell";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, userRole, signOut } = useAuth();
  const { data: profile } = useMyProfile();
  const { t } = useI18n();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount();

  const links = [
    { to: "/", label: t("nav_portal_home"), icon: Home, admin: false },
    { to: "/dashboard", label: t("nav_start"), icon: LayoutDashboard, admin: false },
    { to: "/projects", label: t("nav_projects"), icon: Briefcase, admin: false },
    { to: "/my-projects", label: t("nav_my_projects"), icon: ListChecks, admin: false },
    { to: "/inkorg", label: t("nav_inbox"), icon: Bell, admin: false },
    { to: "/availability", label: t("nav_availability"), icon: CalendarDays, admin: false },
    { to: "/profile", label: t("nav_my_page"), icon: User, admin: false },
    ...(isAdmin
      ? [
          { to: "/admin/projects", label: t("nav_manage_projects"), icon: ShieldCheck, admin: true },
          { to: "/admin/users", label: t("nav_admin_panel"), icon: Settings2, admin: true },
          { to: "/admin/staff", label: t("nav_staff_list"), icon: Users, admin: true },
        ]
      : []),
  ];

  const isActive = (to: string) => to === "/" ? path === "/" : path === to || path.startsWith(to + "/");

  const displayName = profile?.full_name?.trim().split(/\s+/)[0] || "User";

  const SidebarInner = (
    <div className="flex h-full flex-col">
      {/* Logo & brand — logo acts as "door" back to main website */}
      <div className="px-6 py-8 flex flex-col items-center border-b border-white/[0.08]">
        <a href="https://alloevent.se" target="_self" onClick={() => setOpen(false)}>
          <img src={logo} alt="Allo Event" className="h-10 w-auto" />
        </a>
        <span className="mt-2 text-[10px] font-heading font-medium uppercase tracking-[0.35em] text-foreground/60">
          PORTAL
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map((l) => {
          const active = isActive(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative ${
                active
                  ? "text-foreground bg-white/[0.04]"
                  : "text-foreground/45 hover:text-foreground/75 hover:bg-white/[0.03]"
              }`}
            >
              {active && !l.admin && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full" style={{ backgroundColor: "var(--gold)" }} />
              )}
              {l.admin && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full"
                  style={{ backgroundColor: "var(--gold)", opacity: active ? 1 : 0.45 }}
                />
              )}
              <l.icon
                className="h-4 w-4"
                strokeWidth={1.5}
              />
              <span className="font-medium">{l.label}</span>
              {l.to === "/inkorg" && unreadCount > 0 && (
                <span
                  className="ml-auto inline-flex items-center justify-center h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: "rgba(212, 165, 116, 0.18)",
                    color: "var(--gold)",
                    border: "1px solid rgba(212, 165, 116, 0.35)",
                    boxShadow: "0 0 8px rgba(212, 165, 116, 0.25)",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: profile + lang + logout */}
      <div className="px-4 pb-5 pt-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 px-1 mb-3">
          <UserAvatar
            url={profile?.avatar_url}
            name={profile?.full_name}
            email={user?.email}
            className="h-8 w-8 ring-1 ring-white/[0.12]"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{displayName}</div>
            <div
              className="text-[10px] uppercase tracking-[0.25em]"
              style={{
                color: isAdmin ? "var(--gold)" : "var(--muted-foreground)",
                fontFamily: isAdmin ? "'Urbanist', sans-serif" : "var(--font-sans)",
                fontWeight: isAdmin ? 700 : 500,
              }}
            >
              {isAdmin ? "ADMIN" : "CREW"}
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); nav({ to: "/" }); }}
            className="text-foreground/35 hover:text-foreground transition-colors p-1"
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
      <aside className="hidden md:flex w-64 shrink-0 border-r border-white/[0.08] sticky top-0 h-screen" style={{ backgroundColor: "var(--sidebar-bg)" }}>
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-white/[0.08] bg-background/85 backdrop-blur-lg flex items-center justify-between px-4">
        <a href="https://alloevent.se" target="_self" className="flex items-center gap-2">
          <img src={logo} alt="Allo Event" className="h-7 w-auto" />
        </a>
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user && (
            <Link to="/profile" aria-label="Profile" className="rounded-full">
              <UserAvatar
                url={profile?.avatar_url}
                name={profile?.full_name}
                email={user.email}
                className="h-8 w-8 ring-1 ring-white/[0.15]"
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
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

      <main className="flex-1 min-w-0 pt-14 md:pt-0 relative">
        {/* Desktop top-right notification + profile bar */}
        {user && (
          <div className="hidden md:flex fixed top-0 right-0 z-30 items-center gap-3 px-6 py-3">
            <NotificationBell />
            <Link to="/profile" aria-label="Profile" className="rounded-full">
              <UserAvatar
                url={profile?.avatar_url}
                name={profile?.full_name}
                email={user.email}
                className="h-8 w-8 ring-1 ring-white/[0.15]"
              />
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
