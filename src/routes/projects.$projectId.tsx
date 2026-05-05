import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Shirt,
  Users,
  ExternalLink,
  CheckCircle2,
  ClipboardList,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projects/$projectId")({
  component: () => <RequireAuth><ProjectDetail /></RequireAuth>,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const qc = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: myInterest, refetch } = useQuery({
    queryKey: ["my-interest", projectId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("project_interests")
        .select("*").eq("project_id", projectId).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (myInterest) {
        await supabase.from("project_interests").delete().eq("id", myInterest.id);
        return { wasInterested: true };
      }
      const { error } = await supabase.from("project_interests").insert({ user_id: user!.id, project_id: projectId });
      if (error) throw error;
      return { wasInterested: false };
    },
    onSuccess: (result) => {
      refetch();
      qc.invalidateQueries({ queryKey: ["my-interests-ids"] });
      qc.invalidateQueries({ queryKey: ["my-interests-dash"] });
      qc.invalidateQueries({ queryKey: ["my-interests-list"] });
      qc.invalidateQueries({ queryKey: ["project-applicants", projectId] });
      toast.success(result.wasInterested ? t("interest_withdrawn") : t("interest_registered"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isConfirmed = myInterest?.status === "confirmed";

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/projects"><ArrowLeft className="mr-1 h-4 w-4" /> {t("back")}</Link>
      </Button>
      {isLoading && <p className="text-muted-foreground">{t("loading")}</p>}
      {project && (
        <article className="bg-card border border-border rounded-2xl overflow-hidden">
          {project.image_url && (
            <img src={project.image_url} alt={project.title} className="w-full h-72 md:h-96 object-cover" />
          )}
          <div className="p-8 md:p-10">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                {project.category && (
                  <span className="px-2 py-1 bg-secondary text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider">{project.category}</span>
                )}
                <h1 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">{project.title}</h1>
              </div>
              {isConfirmed && (
                <div className="inline-flex items-center gap-2 rounded-md bg-success/15 text-success border border-success/30 px-3 py-1.5 text-xs font-bold tracking-[0.2em]">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("status_confirmed_big")}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
              <div className="flex items-start gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest">{t("schedule")}</div>
                  <div className="text-foreground mt-0.5">
                    {format(new Date(project.starts_at), "PPP p", { locale })}
                    {project.ends_at && ` – ${format(new Date(project.ends_at), "PPP p", { locale })}`}
                  </div>
                </div>
              </div>
              {project.location && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("location_label")}</div>
                    <div className="text-foreground mt-0.5">{project.location}</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-primary text-xs inline-flex items-center gap-1 mt-1 hover:underline"
                    >
                      {t("open_in_maps")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              {project.dress_code && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Shirt className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("dress_code")}</div>
                    <div className="text-foreground mt-0.5">{project.dress_code}</div>
                  </div>
                </div>
              )}
              {project.positions_needed && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("positions")}</div>
                    <div className="text-foreground mt-0.5">{project.positions_needed}</div>
                  </div>
                </div>
              )}
            </div>

            {project.description && (
              <div className="mt-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">{t("details")}</div>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">{project.description}</div>
              </div>
            )}

            {isConfirmed && (
              <section className="mt-10 rounded-xl border border-success/30 bg-success/5 p-6">
                <div className="flex items-center gap-2 text-success text-[10px] font-mono uppercase tracking-widest">
                  <ClipboardList className="h-4 w-4" />
                  {t("briefing_tab")}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("briefing_intro")}</p>
                <div className="mt-4 whitespace-pre-line leading-relaxed text-sm">
                  {project.staff_instructions
                    ? project.staff_instructions
                    : <span className="text-muted-foreground italic">{t("briefing_empty")}</span>}
                </div>
              </section>
            )}

            {!isConfirmed && myInterest && (
              <section className="mt-10 rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-3">
                <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {t("briefing_tab")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{t("briefing_locked")}</p>
                </div>
              </section>
            )}

            <div className="mt-10 pt-6 border-t border-border flex items-center gap-3 flex-wrap">
              <Button size="lg" variant={myInterest ? "secondary" : "default"} onClick={() => toggle.mutate()} disabled={toggle.isPending}>
                {myInterest ? t("signed_up") : t("show_interest")}
              </Button>
              {myInterest && !isConfirmed && (
                <span className="text-xs text-muted-foreground">{t("signed_up_hint")}</span>
              )}
            </div>
          </div>
        </article>
      )}
    </main>
  );
}
