import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { Button } from "@/components/ui/button";
import { Home, Briefcase, User, LogOut, Menu, X, ShieldCheck, CalendarDays, ListChecks } from "lucide-react";
import logo from "@/assets/allo-logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
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

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logo} alt="Allo Event" className="h-9 w-auto" />
        </Link>
        {user && (
          <div className="mt-5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              {(user.email?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.email}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {isAdmin ? "Admin" : "Crew"}
              </div>
            </div>
          </div>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => {
          const Active = isActive(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                Active
                  ? "bg-primary/15 text-primary border-l-2 border-primary pl-[10px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Lang</span>
          <LangToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={async () => { await signOut(); nav({ to: "/" }); }}
        >
          <LogOut className="h-4 w-4 mr-2" /> {t("nav_logout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card/40 sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background/85 backdrop-blur flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Allo Event" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <Button size="icon" variant="ghost" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-background border-r border-border h-full animate-in slide-in-from-left duration-200">
            <button
              className="absolute top-3 right-3 h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
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
