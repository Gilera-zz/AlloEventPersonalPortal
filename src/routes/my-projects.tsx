import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Badge } from "@/components/ui/badge";
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
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{t("my_projects")}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("nav_my_projects")}</h1>
      </header>
      {(!data || data.length === 0) && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
          {t("no_active")}
        </div>
      )}
      <div className="space-y-5">
        {data?.map((row) => (
          <ProjectCard key={row.projects.id} project={row.projects} action={
            row.status === "confirmed" ? (
              <Badge className="bg-success text-background hover:bg-success/90 border-transparent font-bold tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-background" />
                {t("status_confirmed_big")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="capitalize">
                <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-yellow-500" />
                {row.status === "interested" ? t("status_interested") : t("status_pending")}
              </Badge>
            )
          } />
        ))}
      </div>
    </main>
  );
}
