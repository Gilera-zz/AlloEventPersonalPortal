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
import { localized } from "@/lib/translate";

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

  const title = project ? (localized(project, "title", lang) ?? project.title) : "";
  const description = project ? localized(project, "description", lang) : null;
  const location = project ? localized(project, "location", lang) : null;
  const dressCode = project ? localized(project, "dress_code", lang) : null;
  const instructions = project ? localized(project, "staff_instructions", lang) : null;

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 text-foreground/50 hover:text-foreground">
        <Link to="/projects"><ArrowLeft className="mr-1 h-4 w-4" /> {t("back")}</Link>
      </Button>
      {isLoading && <p className="text-foreground/40">{t("loading")}</p>}
      {project && (
        <article className="glass rounded-xl overflow-hidden">
          {project.image_url && (
            <img src={project.image_url} alt={title} className="w-full h-72 md:h-96 object-cover" />
          )}
          <div className="p-8 md:p-10">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                {project.category && (
                  <span className="px-2 py-1 bg-white/[0.06] border border-white/[0.08] text-foreground/45 rounded text-[10px] font-bold uppercase tracking-wider">{project.category}</span>
                )}
                <h1 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">{title}</h1>
              </div>
              {isConfirmed && (
                <div
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold tracking-[0.2em]"
                  style={{ backgroundColor: "rgba(212, 165, 116, 0.12)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("status_confirmed_big")}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
              <div className="flex items-start gap-3 text-foreground/45">
                <Calendar className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest">{t("schedule")}</div>
                  <div className="text-foreground mt-0.5">
                    {format(new Date(project.starts_at), "PPP p", { locale })}
                    {project.ends_at && ` – ${format(new Date(project.ends_at), "PPP p", { locale })}`}
                  </div>
                </div>
              </div>
              {location && (
                <div className="flex items-start gap-3 text-foreground/45">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("location_label")}</div>
                    <div className="text-foreground mt-0.5">{location}</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location ?? location)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-foreground/50 text-xs inline-flex items-center gap-1 mt-1 hover:text-foreground hover:underline transition-colors"
                    >
                      {t("open_in_maps")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              {dressCode && (
                <div className="flex items-start gap-3 text-foreground/45">
                  <Shirt className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("dress_code")}</div>
                    <div className="text-foreground mt-0.5">{dressCode}</div>
                  </div>
                </div>
              )}
              {project.positions_needed && (
                <div className="flex items-start gap-3 text-foreground/45">
                  <Users className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest">{t("positions")}</div>
                    <div className="text-foreground mt-0.5">{project.positions_needed}</div>
                  </div>
                </div>
              )}
            </div>

            {description && (
              <div className="mt-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 mb-3">{t("details")}</div>
                <div className="text-foreground/55 whitespace-pre-line leading-relaxed">{description}</div>
              </div>
            )}

            {isConfirmed && (
              <section className="mt-10 rounded-xl p-6" style={{ backgroundColor: "rgba(212, 165, 116, 0.06)", border: "1px solid rgba(212, 165, 116, 0.2)" }}>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--gold)" }}>
                  <ClipboardList className="h-4 w-4" />
                  {t("briefing_tab")}
                </div>
                <p className="text-xs text-foreground/40 mt-2">{t("briefing_intro")}</p>
                <div className="mt-4 whitespace-pre-line leading-relaxed text-sm">
                  {instructions
                    ? instructions
                    : <span className="text-foreground/35 italic">{t("briefing_empty")}</span>}
                </div>
              </section>
            )}

            {!isConfirmed && myInterest && (
              <section className="mt-10 glass rounded-xl p-5 flex items-start gap-3">
                <Lock className="h-4 w-4 text-foreground/35 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    {t("briefing_tab")}
                  </div>
                  <p className="text-sm text-foreground/40 mt-1">{t("briefing_locked")}</p>
                </div>
              </section>
            )}

            <div className="mt-10 pt-6 border-t border-white/[0.08] flex items-center gap-3 flex-wrap">
              <Button size="lg" variant={myInterest ? "secondary" : "default"} onClick={() => toggle.mutate()} disabled={toggle.isPending}>
                {myInterest ? t("signed_up") : t("show_interest")}
              </Button>
              {myInterest && !isConfirmed && (
                <span className="text-xs text-foreground/40">{t("signed_up_hint")}</span>
              )}
            </div>
          </div>
        </article>
      )}
    </main>
  );
}
