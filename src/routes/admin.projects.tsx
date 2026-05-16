import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  Save,
  Languages,
  Loader2,
  UserPlus,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/admin/projects")({
  component: () => <RequireAuth requireAdmin><AdminProjects /></RequireAuth>,
});

interface ApplicantProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  experience: string | null;
  skills: string[] | null;
  special_skills: string[] | null;
  clothing_size: string | null;
  occupation: string | null;
  roles: string[] | null;
}

interface ApplicantRow {
  id: string;
  status: string;
  user_id: string;
  created_at: string;
  profiles: ApplicantProfile | null;
}

const TRANSLATABLE_FIELDS = ["title", "description", "location", "dress_code", "staff_instructions", "meeting_point", "salary_info", "requirements"] as const;

function AdminProjects() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const empty = { title: "", description: "", category: "", location: "", starts_at: "", ends_at: "", dress_code: "", positions_needed: 1, image_url: "", meeting_point: "", salary_info: "", requirements: "" };
  const [form, setForm] = useState<any>(empty);
  const [uploading, setUploading] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, project_interests(count)").order("starts_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `${user!.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("project-images").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("project-images").getPublicUrl(path);
    setForm((f: any) => ({ ...f, image_url: data.publicUrl }));
    toast.success("OK");
  };

  const create = useMutation({
    mutationFn: async () => {
      const { data: inserted, error } = await supabase.from("projects").insert({
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        location: form.location || null,
        starts_at: form.starts_at,
        ends_at: form.ends_at || null,
        dress_code: form.dress_code || null,
        positions_needed: Number(form.positions_needed) || 1,
        image_url: form.image_url || null,
        meeting_point: form.meeting_point || null,
        salary_info: form.salary_info || null,
        requirements: form.requirements || null,
        created_by: user!.id,
      }).select("id, title, category").single();
      if (error) throw error;

      if (inserted?.category) {
        const { data: matchingProfiles } = await supabase
          .from("profiles")
          .select("id, roles")
          .not("roles", "is", null);

        const matched = (matchingProfiles ?? []).filter((p) =>
          Array.isArray(p.roles) && p.roles.some((r: string) =>
            r.toLowerCase() === inserted.category!.toLowerCase()
          ),
        );

        if (matched.length > 0) {
          const projectName = inserted.title;
          const notifTitle = lang === "sv"
            ? "Nytt matchande uppdrag tillgängligt!"
            : "New matching job available!";
          const notifMessage = lang === "sv"
            ? `Ett nytt projekt (${projectName}) har publicerats som matchar dina valda roller. Gå in och sök det idag!`
            : `A new project (${projectName}) has been published that matches your selected roles. Go apply today!`;

          const notifications = matched.map((p) => ({
            user_id: p.id,
            project_id: inserted.id,
            title: notifTitle,
            message: notifMessage,
            type: "matching_job",
          }));

          await supabase.from("notifications").insert(notifications as any);
        }
      }
    },
    onSuccess: () => { toast.success("OK"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-projects"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("projects").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); },
  });

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">Admin</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("admin_title")}</h1>
        </div>
        <Button onClick={() => setOpen(!open)}><Plus className="mr-1 h-4 w-4" /> {open ? t("cancel") : t("new_project")}</Button>
      </header>

      {open && (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="glass rounded-xl p-6 mb-8 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>{t("title_label")}</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>{t("category")}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>{t("location_label")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>{t("dress_code")}</Label><Input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} /></div>
            <div><Label>{t("starts")}</Label><Input type="datetime-local" required value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div><Label>{t("ends")}</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            <div><Label>{t("positions_count")}</Label><Input type="number" min={1} value={form.positions_needed} onChange={(e) => setForm({ ...form, positions_needed: e.target.value })} /></div>
            <div>
              <Label>{t("image")}</Label>
              <Input type="file" accept="image/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-16 rounded object-cover" />}
            </div>
            <div>
              <Label>{t("meeting_point")}</Label>
              <Input value={form.meeting_point} onChange={(e) => setForm({ ...form, meeting_point: e.target.value })} placeholder={t("meeting_point_help")} />
            </div>
            <div>
              <Label>{t("salary_info")}</Label>
              <Input value={form.salary_info} onChange={(e) => setForm({ ...form, salary_info: e.target.value })} placeholder={t("salary_info_help")} />
            </div>
          </div>
          <div><Label>{t("description")}</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>{t("requirements")}</Label><Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder={t("requirements_help")} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={create.isPending || uploading}>{t("create")}</Button></div>
        </form>
      )}

      <div className="space-y-3">
        {projects?.map((p: any) => (
          <div key={p.id} className="glass rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <button className="flex-1 text-left min-w-0" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <div className="font-semibold truncate">{p.title}</div>
                <div className="text-xs text-foreground/40 mt-1">
                  {format(new Date(p.starts_at), "PPP", { locale })} · {p.location || "—"} · {p.project_interests?.[0]?.count ?? 0} {t("applicants").toLowerCase()}
                </div>
              </button>
              <Button size="icon" variant="ghost" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                {expandedId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)} className="text-foreground/30 hover:text-foreground/60">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {expandedId === p.id && <ProjectAdminPanel project={p} />}
          </div>
        ))}
        {projects?.length === 0 && <p className="text-foreground/40">—</p>}
      </div>
    </main>
  );
}

function ProjectAdminPanel({ project }: { project: any }) {
  const { t } = useI18n();
  return (
    <div className="border-t border-white/[0.08] bg-white/[0.02] p-4">
      {/* Project details summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {project.meeting_point && (
          <div className="glass rounded-md px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{t("meeting_point")}</div>
            <div className="text-sm mt-0.5">{project.meeting_point}</div>
          </div>
        )}
        {project.salary_info && (
          <div className="glass rounded-md px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{t("salary_info")}</div>
            <div className="text-sm mt-0.5">{project.salary_info}</div>
          </div>
        )}
        {project.requirements && (
          <div className="glass rounded-md px-3 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{t("requirements")}</div>
            <div className="text-sm mt-0.5">{project.requirements}</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="applicants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="applicants">{t("tab_applicants")}</TabsTrigger>
          <TabsTrigger value="staff">{t("tab_staff")}</TabsTrigger>
          <TabsTrigger value="logistics">{t("tab_logistics")}</TabsTrigger>
          <TabsTrigger value="briefing">{t("tab_briefing")}</TabsTrigger>
        </TabsList>
        <TabsContent value="applicants">
          <ApplicantsPanel project={project} />
        </TabsContent>
        <TabsContent value="staff">
          <StaffBookingPanel project={project} />
        </TabsContent>
        <TabsContent value="logistics">
          <LogisticsPanel projectId={project.id} />
        </TabsContent>
        <TabsContent value="briefing">
          <BriefingPanel project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function useApplicants(projectId: string) {
  return useQuery<ApplicantRow[], Error>({
    queryKey: ["project-applicants", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_interests")
        .select("*, profiles:profiles!project_interests_user_id_profiles_fkey(*)")
        .eq("project_id", projectId);

      if (error) throw new Error(error.message);

      return (data ?? []).map((row: any) => ({
        id: row.id,
        status: row.status,
        user_id: row.user_id,
        created_at: row.created_at,
        profiles: row.profiles
          ? {
              id: row.profiles.id,
              full_name: row.profiles.full_name ?? null,
              email: row.profiles.email ?? null,
              phone: row.profiles.phone ?? null,
              avatar_url: row.profiles.avatar_url ?? null,
              bio: row.profiles.bio ?? null,
              experience: row.profiles.experience ?? null,
              skills: Array.isArray(row.profiles.skills) ? row.profiles.skills : null,
              special_skills: Array.isArray(row.profiles.special_skills) ? row.profiles.special_skills : null,
              clothing_size: row.profiles.clothing_size ?? null,
              occupation: row.profiles.occupation ?? null,
              roles: Array.isArray(row.profiles.roles) ? row.profiles.roles : null,
            }
          : null,
      })) as ApplicantRow[];
    },
  });
}

function ApplicantsPanel({ project }: { project: any }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [profileOpen, setProfileOpen] = useState<ApplicantProfile | null>(null);
  const projectId = project.id;

  const { data: applicants, isLoading, error: queryError } = useApplicants(projectId);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, userId }: { id: string; status: string; userId: string }) => {
      const { error } = await supabase.from("project_interests").update({ status }).eq("id", id);
      if (error) throw error;

      if (status === "confirmed") {
        const projectName = project.title || "—";
        const title = lang === "sv" ? "Du har blivit bekräftad!" : "You have been confirmed!";
        const message = lang === "sv"
          ? `Grattis! Du har blivit utvald och bekräftad för projektet ${projectName}. Gå till projektet för att se detaljer och samlingsplats.`
          : `Congratulations! You have been selected and confirmed for the project ${projectName}. Go to the project to see details and meeting point.`;

        await supabase.from("notifications").insert({
          user_id: userId,
          project_id: projectId,
          title,
          message,
          type: "confirmation",
        } as any);
      }

      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "confirmed" ? t("staff_confirmed") : t("staff_unconfirmed"));
      qc.invalidateQueries({ queryKey: ["project-applicants", projectId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/40 mb-3">{t("applicants")}</div>
      {queryError && (
        <p className="text-sm text-destructive mb-2 break-words">
          {queryError.message}
        </p>
      )}
      {isLoading && <p className="text-sm text-foreground/40">{t("loading")}</p>}
      {!isLoading && !queryError && (!applicants || applicants.length === 0) && (
        <p className="text-sm text-foreground/40">{t("no_applicants")}</p>
      )}
      <ul className="space-y-2">
        {applicants?.map((a) => {
          const confirmed = a.status === "confirmed";
          const displayName = a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8);
          return (
            <li key={a.id} className="flex items-center justify-between gap-3 glass rounded-md px-3 py-2">
              <button
                type="button"
                className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-white/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => a.profiles && setProfileOpen(a.profiles)}
                aria-label={t("view_profile")}
              >
                <UserAvatar
                  url={a.profiles?.avatar_url}
                  name={a.profiles?.full_name}
                  email={a.profiles?.email}
                  className="h-9 w-9 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate underline-offset-2 hover:underline">{displayName}</span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0"
                      style={confirmed
                        ? { backgroundColor: "rgba(212, 165, 116, 0.12)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }
                        : { backgroundColor: "rgba(255, 255, 255, 0.06)", color: "var(--muted-foreground)", border: "1px solid rgba(255, 255, 255, 0.08)" }
                      }
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: confirmed ? "var(--gold)" : "var(--muted-foreground)" }}
                      />
                      {confirmed ? t("status_confirmed") : a.status === "pending" ? t("status_pending") : t("status_interested")}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/35 truncate">
                    {a.profiles?.email}
                    {a.profiles?.phone && ` · ${a.profiles.phone}`}
                  </div>
                </div>
              </button>
              <Button
                size="sm"
                variant={confirmed ? "secondary" : "default"}
                onClick={() => updateStatus.mutate({ id: a.id, status: confirmed ? "interested" : "confirmed", userId: a.user_id })}
              >
                {confirmed ? <><Circle className="h-3 w-3 mr-1" /> {t("unconfirm")}</> : <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("confirm")}</>}
              </Button>
            </li>
          );
        })}
      </ul>

      <ApplicantProfileModal
        profile={profileOpen}
        onOpenChange={(open) => !open && setProfileOpen(null)}
      />
    </div>
  );
}

function StaffBookingPanel({ project }: { project: any }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: applicants } = useApplicants(project.id);

  const assignedStaff = useMemo(
    () => (applicants ?? []).filter((a) => a.status === "confirmed" || a.status === "pending"),
    [applicants],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/40">
          {t("assigned_staff")}
        </div>
        <Button size="sm" onClick={() => setBookingOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          {t("book_staff")}
        </Button>
      </div>

      {assignedStaff.length === 0 && (
        <p className="text-sm text-foreground/40">{t("no_applicants")}</p>
      )}

      <ul className="space-y-2">
        {assignedStaff.map((a) => {
          const displayName = a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8);
          const isPending = a.status === "pending";
          return (
            <li key={a.id} className="flex items-center gap-3 glass rounded-md px-3 py-2">
              <UserAvatar url={a.profiles?.avatar_url} name={a.profiles?.full_name} email={a.profiles?.email} className="h-8 w-8 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{displayName}</span>
                {a.profiles?.roles && a.profiles.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {a.profiles.roles.map((r) => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(212, 165, 116, 0.08)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.2)" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0"
                style={isPending
                  ? { backgroundColor: "rgba(255, 255, 255, 0.06)", color: "var(--muted-foreground)", border: "1px solid rgba(255, 255, 255, 0.08)" }
                  : { backgroundColor: "rgba(212, 165, 116, 0.12)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isPending ? "var(--muted-foreground)" : "var(--gold)" }} />
                {isPending ? t("status_pending") : t("status_confirmed")}
              </span>
            </li>
          );
        })}
      </ul>

      {bookingOpen && (
        <StaffBookingDialog
          project={project}
          existingUserIds={(applicants ?? []).map((a) => a.user_id)}
          onClose={() => {
            setBookingOpen(false);
            qc.invalidateQueries({ queryKey: ["project-applicants", project.id] });
            qc.invalidateQueries({ queryKey: ["admin-projects"] });
          }}
        />
      )}
    </div>
  );
}

function StaffBookingDialog({
  project,
  existingUserIds,
  onClose,
}: {
  project: any;
  existingUserIds: string[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const { data: allStaff } = useQuery({
    queryKey: ["booking-staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, roles, special_skills, occupation")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: conflicts } = useQuery({
    queryKey: ["booking-conflicts", project.id],
    queryFn: async () => {
      if (!project.starts_at) return new Set<string>();
      const { data, error } = await supabase
        .from("project_interests")
        .select("user_id, projects!project_interests_project_id_fkey(starts_at, ends_at)")
        .eq("status", "confirmed")
        .neq("project_id", project.id);
      if (error) return new Set<string>();
      const pStart = new Date(project.starts_at).getTime();
      const pEnd = project.ends_at ? new Date(project.ends_at).getTime() : pStart;
      const conflicting = new Set<string>();
      for (const row of data ?? []) {
        const other = row.projects as any;
        if (!other?.starts_at) continue;
        const oStart = new Date(other.starts_at).getTime();
        const oEnd = other.ends_at ? new Date(other.ends_at).getTime() : oStart;
        if (pStart <= oEnd && pEnd >= oStart) {
          conflicting.add(row.user_id);
        }
      }
      return conflicting;
    },
  });

  const available = useMemo(() => {
    return (allStaff ?? []).filter((s) => {
      if (existingUserIds.includes(s.id)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.occupation?.toLowerCase().includes(q) ||
        (s.roles ?? []).some((r: string) => r.toLowerCase().includes(q))
      );
    });
  }, [allStaff, existingUserIds, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const inserts = Array.from(selected).map((user_id) => ({
        user_id,
        project_id: project.id,
        status: "pending",
      }));
      const { error } = await supabase.from("project_interests").insert(inserts);
      if (error) throw error;
      toast.success(t("requests_sent"));
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("book_staff_title")}</DialogTitle>
          <p className="text-sm text-foreground/45 mt-1">{t("book_staff_subtitle")}</p>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_users")}
            className="pl-10"
          />
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {available.map((s) => {
            const isSelected = selected.has(s.id);
            const hasConflict = conflicts?.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSelect(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                  isSelected ? "bg-white/[0.06] border border-white/[0.12]" : "hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                  isSelected ? "border-[var(--gold)] bg-[rgba(212,165,116,0.15)]" : "border-white/[0.2]"
                }`}>
                  {isSelected && <CheckCircle2 className="h-3 w-3" style={{ color: "var(--gold)" }} />}
                </div>
                <UserAvatar url={s.avatar_url} name={s.full_name} email={s.email} className="h-8 w-8 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.full_name || s.email || "—"}</div>
                  {(s.roles ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {(s.roles as string[]).map((r) => (
                        <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(212, 165, 116, 0.08)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.2)" }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {hasConflict && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 shrink-0" title={t("conflict_warning")}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
          {available.length === 0 && (
            <p className="text-sm text-foreground/40 text-center py-4">{t("no_staff")}</p>
          )}
        </div>

        {selected.size > 0 && conflicts && Array.from(selected).some((id) => conflicts.has(id)) && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-md" style={{ backgroundColor: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.2)" }}>
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">{t("conflict_warning")}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.08]">
          <span className="text-xs text-foreground/40">
            {selected.size} {t("selected_count")}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={handleSend} disabled={selected.size === 0 || sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
              {t("send_requests")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicantProfileModal({
  profile,
  onOpenChange,
}: {
  profile: ApplicantProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const open = !!profile;
  const rawSkills = profile?.special_skills ?? profile?.skills;
  const skills = Array.isArray(rawSkills) ? rawSkills : [];
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  const displayName = profile?.full_name || profile?.email || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar
              url={profile?.avatar_url}
              name={profile?.full_name}
              email={profile?.email}
              className="h-12 w-12"
            />
            <div className="min-w-0">
              <DialogTitle className="truncate">{displayName}</DialogTitle>
              {profile?.occupation && (
                <p className="text-xs text-foreground/40 mt-0.5">{profile.occupation}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-2">
              {t("profile_modal_contact")}
            </div>
            <div className="text-sm space-y-1">
              {profile?.email && (
                <div className="flex items-center gap-2 text-foreground/55">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a className="hover:underline" href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2 text-foreground/55">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a className="hover:underline" href={`tel:${profile.phone}`}>{profile.phone}</a>
                </div>
              )}
              {!profile?.email && !profile?.phone && (
                <p className="text-sm text-foreground/40">{t("profile_modal_empty")}</p>
              )}
            </div>
          </section>

          {roles.length > 0 && (
            <section>
              <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-2">
                {t("profile_modal_roles")}
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "rgba(212, 165, 116, 0.08)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-2">
              {t("profile_modal_about")}
            </div>
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {profile?.bio || t("profile_modal_empty")}
            </p>
          </section>

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-2">
              {t("special_skills")}
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "rgba(212, 165, 116, 0.08)", color: "var(--gold)", border: "1px solid rgba(212, 165, 116, 0.25)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/40">{t("profile_modal_empty")}</p>
            )}
          </section>

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-2">
              {t("profile_modal_experience")}
            </div>
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {profile?.experience || t("profile_modal_empty")}
            </p>
          </section>

          {profile?.clothing_size && (
            <section className="pt-2 border-t border-white/[0.08]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{t("clothing_size")}</div>
              <div className="text-sm font-medium mt-0.5">{profile.clothing_size}</div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogisticsPanel({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const { data: applicants, isLoading } = useApplicants(projectId);

  const summary = useMemo(() => {
    const confirmed = (applicants ?? []).filter((a) => a.status === "confirmed");
    const counts = new Map<string, number>();
    for (const a of confirmed) {
      const size = a.profiles?.clothing_size?.trim();
      const key = size && size.length > 0 ? size : "__missing__";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ordered = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const rows: { label: string; count: number; missing?: boolean }[] = [];
    for (const size of ordered) {
      if (counts.has(size)) rows.push({ label: size, count: counts.get(size)! });
    }
    for (const [key, count] of counts) {
      if (key === "__missing__" || ordered.includes(key)) continue;
      rows.push({ label: key, count });
    }
    if (counts.has("__missing__")) {
      rows.push({ label: t("logistics_missing_size"), count: counts.get("__missing__")!, missing: true });
    }
    return { rows, total: confirmed.length };
  }, [applicants, t]);

  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/40 mb-3">
        {t("logistics_title")}
      </div>
      {isLoading && <p className="text-sm text-foreground/40">{t("loading")}</p>}
      {!isLoading && summary.total === 0 && (
        <p className="text-sm text-foreground/40">{t("logistics_empty")}</p>
      )}
      {summary.total > 0 && (
        <>
          <ul className="grid sm:grid-cols-2 gap-2">
            {summary.rows.map((r) => (
              <li
                key={r.label}
                className={`flex items-center justify-between glass rounded-md px-3 py-2 text-sm ${
                  r.missing ? "text-foreground/40 italic" : ""
                }`}
              >
                <span className="font-medium">{r.label}</span>
                <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 text-xs font-mono">{r.count} st</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs font-mono uppercase tracking-widest text-foreground/40">
            {t("logistics_total")}: <span className="text-foreground font-bold">{summary.total}</span>
          </div>
        </>
      )}
    </div>
  );
}

function BriefingPanel({ project }: { project: any }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [text, setText] = useState<string>(project.staff_instructions ?? "");
  const [translating, setTranslating] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("projects")
        .update({ staff_instructions: text })
        .eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("save"));
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleGenerateTranslations = async () => {
    setTranslating(true);
    try {
      const fields: Record<string, string> = {};
      for (const key of TRANSLATABLE_FIELDS) {
        const val = project[key];
        if (typeof val === "string" && val.trim().length > 0) {
          const enKey = `${key}_en`;
          if (!project[enKey] || (typeof project[enKey] === "string" && project[enKey].trim().length === 0)) {
            fields[key] = val;
          }
        }
      }

      if (Object.keys(fields).length === 0) {
        toast.success(t("translation_saved"));
        setTranslating(false);
        return;
      }

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) throw new Error("Translation request failed");

      const { translations } = await res.json();

      const updatePayload: Record<string, string> = {};
      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === "string" && value.trim().length > 0) {
          updatePayload[`${key}_en`] = value;
        }
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase
          .from("projects")
          .update(updatePayload as any)
          .eq("id", project.id);
        if (error) throw error;
      }

      toast.success(t("translation_saved"));
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (e: any) {
      toast.error(t("translation_error"));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/40 mb-1">
          {t("staff_instructions")}
        </div>
        <p className="text-xs text-foreground/35 mb-3">{t("staff_instructions_help")}</p>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("briefing_intro")}
          className="resize-none"
        />
      </div>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={handleGenerateTranslations}
          disabled={translating}
        >
          {translating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("generating_en")}</>
          ) : (
            <><Languages className="h-4 w-4 mr-2" /> {t("generate_en")}</>
          )}
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {save.isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
