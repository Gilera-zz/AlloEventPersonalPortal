import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/my-projects")({
  component: () => <RequireAuth><MyProjects /></RequireAuth>,
});

function MyProjects() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["my-interests-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_interests")
        .select("status, projects(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { status: string; projects: ProjectRow }[];
    },
  });

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">{t("my_projects")}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("nav_my_projects")}</h1>
      </header>
      {(!data || data.length === 0) && (
        <div className="glass rounded-xl p-8 text-center text-foreground/40 text-sm border-dashed">
          {t("no_active")}
        </div>
      )}
      <div className="space-y-5">
        {data?.map((row) => (
          <ProjectCard key={row.projects.id} project={row.projects} action={
            row.status === "confirmed" ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] shrink-0"
                style={{ backgroundColor: "rgba(212, 165, 116, 0.12)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--gold)" }} />
                {t("status_confirmed_big")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium text-foreground/50 capitalize shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                {row.status === "interested" ? t("status_interested") : t("status_pending")}
              </span>
            )
          } />
        ))}
      </div>
    </main>
  );
}
