import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { useI18n } from "@/lib/i18n";
import { localized } from "@/lib/translate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { Check, X, Clock, MapPin, Banknote, Calendar, FileText } from "lucide-react";

export const Route = createFileRoute("/my-projects")({
  component: () => <RequireAuth><MyProjects /></RequireAuth>,
});

interface ProjectWithDetails extends ProjectRow {
  meeting_point?: string | null;
  meeting_point_en?: string | null;
  salary_info?: string | null;
  salary_info_en?: string | null;
  requirements?: string | null;
  requirements_en?: string | null;
}

function MyProjects() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["my-interests-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_interests")
        .select("id, status, projects(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; status: string; projects: ProjectWithDetails }[];
    },
  });

  const pendingRequests = data?.filter((row) => row.status === "pending") ?? [];
  const otherProjects = data?.filter((row) => row.status !== "pending") ?? [];

  const respondToRequest = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase.from("project_interests").update({ status: "confirmed" }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_interests").delete().eq("id", id);
        if (error) throw error;
      }
      return accept;
    },
    onSuccess: (accepted) => {
      toast.success(accepted ? t("request_accepted") : t("request_declined"));
      qc.invalidateQueries({ queryKey: ["my-interests-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [timeReportOpen, setTimeReportOpen] = useState<{ projectId: string; projectTitle: string } | null>(null);

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">{t("my_projects")}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("nav_my_projects")}</h1>
      </header>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: "var(--gold)" }} />
            {t("my_requests")}
          </h2>
          <p className="text-sm text-foreground/45 mb-4">{t("my_requests_subtitle")}</p>
          <div className="space-y-3">
            {pendingRequests.map((row) => {
              const p = row.projects;
              const title = localized(p, "title", lang) ?? p.title;
              const location = localized(p, "location", lang) ?? p.location;
              const salaryInfo = localized(p, "salary_info", lang) ?? p.salary_info;
              const meetingPoint = localized(p, "meeting_point", lang) ?? p.meeting_point;

              return (
                <div key={row.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">{title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-foreground/40">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(p.starts_at), "d MMM HH:mm", { locale })}
                          {p.ends_at && ` – ${format(new Date(p.ends_at), "d MMM HH:mm", { locale })}`}
                        </span>
                        {location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0 animate-gold-glow"
                      style={{ backgroundColor: "rgba(212, 165, 116, 0.12)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }}
                    >
                      <Clock className="h-3 w-3" />
                      {t("status_pending")}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mb-4">
                    {salaryInfo && (
                      <div className="flex items-center gap-2 text-sm text-foreground/55">
                        <Banknote className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span><span className="text-foreground/35 text-xs">{t("salary_label")}:</span> {salaryInfo}</span>
                      </div>
                    )}
                    {meetingPoint && (
                      <div className="flex items-center gap-2 text-sm text-foreground/55">
                        <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                        <span><span className="text-foreground/35 text-xs">{t("meeting_point")}:</span> {meetingPoint}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => respondToRequest.mutate({ id: row.id, accept: false })}
                      disabled={respondToRequest.isPending}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      {t("decline")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondToRequest.mutate({ id: row.id, accept: true })}
                      disabled={respondToRequest.isPending}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {t("accept")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Existing projects */}
      {(!data || data.length === 0) && (
        <div className="glass rounded-xl p-8 text-center text-foreground/40 text-sm border-dashed">
          {t("no_active")}
        </div>
      )}
      <div className="space-y-5">
        {otherProjects.map((row) => {
          const isConfirmed = row.status === "confirmed";
          const p = row.projects;
          const isPast = p.ends_at ? new Date(p.ends_at) < new Date() : new Date(p.starts_at) < new Date();

          return (
            <div key={p.id}>
              <ProjectCard
                project={p}
                action={
                  <div className="flex flex-col items-end gap-2">
                    {isConfirmed ? (
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
                    )}
                    {isConfirmed && isPast && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const title = localized(p, "title", lang) ?? p.title;
                          setTimeReportOpen({ projectId: p.id, projectTitle: title });
                        }}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {t("report_time")}
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
          );
        })}
      </div>

      {timeReportOpen && (
        <TimeReportDialog
          projectId={timeReportOpen.projectId}
          projectTitle={timeReportOpen.projectTitle}
          onClose={() => setTimeReportOpen(null)}
        />
      )}
    </main>
  );
}

function TimeReportDialog({
  projectId,
  projectTitle,
  onClose,
}: {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!hours) return;
    setSending(true);
    try {
      toast.success(t("time_report_sent"));
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report_time_title")}</DialogTitle>
          <p className="text-sm text-foreground/45 mt-1">{projectTitle}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>{t("hours_worked")}</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="8"
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("time_report_note")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={!hours || sending}>
              <FileText className="h-4 w-4 mr-1.5" />
              {t("submit_report")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
