import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-event.jpg";

export const Route = createFileRoute("/dashboard")({
  component: () => <RequireAuth><Dashboard /></RequireAuth>,
});

interface ProjectLite {
  id: string; title: string; starts_at: string; ends_at: string | null;
}

function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("id,title,starts_at,ends_at")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as ProjectLite[];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["my-interests-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_interests")
        .select("status, projects(id,title,starts_at)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  // Group upcoming by month key
  const groups = new Map<string, ProjectLite[]>();
  upcoming?.forEach((p) => {
    const key = format(new Date(p.starts_at), "MMMM yyyy", { locale }).toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  return (
    <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border mb-12">
        <img src={hero} alt="" width={1600} height={900} className="w-full h-56 md:h-72 object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          {!profileLoading && (
            <>
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{t("hello")}</span>
              <h1 className="text-3xl md:text-4xl font-bold mt-2">{firstName || user?.email}</h1>
            </>
          )}
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">{t("welcome_body")}</p>
        </div>
      </section>

      {/* New Projects scroll */}
      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("new_projects")}</h2>
          <Button asChild variant="link" className="text-primary">
            <Link to="/projects">{t("show_all")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {(!upcoming || upcoming.length === 0) && (
          <p className="text-sm text-muted-foreground">{t("no_upcoming")}</p>
        )}
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([month, items]) => (
            <div key={month}>
              <div className="text-[11px] font-mono tracking-[0.3em] text-muted-foreground border-b border-border pb-2 mb-3">
                {month}
              </div>
              <ul className="divide-y divide-border">
                {items.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="flex items-center justify-between gap-4 py-3 group"
                    >
                      <span className="font-medium group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200 transform inline-block">
                        {p.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {format(new Date(p.starts_at), "d MMM", { locale })}
                        {p.ends_at && ` – ${format(new Date(p.ends_at), "d MMM", { locale })}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* My projects */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{t("my_projects")}</h2>
        {(!mine || mine.length === 0) ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            {t("no_active")}
          </div>
        ) : (
          <ul className="bg-card border border-border rounded-xl divide-y divide-border">
            {mine.map((m: any) => (
              <li key={m.projects.id}>
                <Link to="/projects/$projectId" params={{ projectId: m.projects.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${m.status === "confirmed" ? "bg-success" : "bg-yellow-500"}`} />
                    <span className="font-medium truncate">{m.projects.title}</span>
                  </div>
                  {m.status === "confirmed" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/15 text-success border border-success/30 px-2 py-0.5 text-[10px] font-bold tracking-[0.2em] shrink-0">
                      {t("status_confirmed_big")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize shrink-0">{m.status}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
