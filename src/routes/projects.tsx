import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projects")({
  component: () => <RequireAuth><Projects /></RequireAuth>,
});

function Projects() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["all-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  const { data: interests } = useQuery({
    queryKey: ["my-interests-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("project_interests").select("project_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((i) => i.project_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ projectId, interested }: { projectId: string; interested: boolean }) => {
      if (interested) {
        await supabase.from("project_interests").delete().eq("user_id", user!.id).eq("project_id", projectId);
      } else {
        const { error } = await supabase.from("project_interests").insert({ user_id: user!.id, project_id: projectId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-interests-ids"] });
      qc.invalidateQueries({ queryKey: ["my-interests-dash"] });
      qc.invalidateQueries({ queryKey: ["my-interests-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{t("projects_kicker")}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("nav_projects")}</h1>
        <p className="text-muted-foreground mt-2">{t("feed_subtitle")}</p>
      </header>
      {projects?.length === 0 && <p className="text-muted-foreground">{t("no_upcoming")}</p>}
      <div className="space-y-5">
        {projects?.map((p) => {
          const isInterested = interests?.has(p.id) ?? false;
          return (
            <ProjectCard key={p.id} project={p} action={
              <Button
                size="sm"
                variant={isInterested ? "secondary" : "default"}
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ projectId: p.id, interested: isInterested })}
              >
                {isInterested ? <><Check className="mr-1 h-3 w-3" /> {t("interested")}</> : t("show_interest")}
              </Button>
            } />
          );
        })}
      </div>
    </main>
  );
}
