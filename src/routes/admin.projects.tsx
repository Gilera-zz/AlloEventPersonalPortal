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
  drivers_license: string | null;
}

interface ApplicantRow {
  id: string;
  status: string;
  user_id: string;
  created_at: string;
  profiles: ApplicantProfile | null;
}

function AdminProjects() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const empty = { title: "", description: "", category: "", location: "", starts_at: "", ends_at: "", dress_code: "", positions_needed: 1, image_url: "" };
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
      const { error } = await supabase.from("projects").insert({
        ...form,
        positions_needed: Number(form.positions_needed) || 1,
        ends_at: form.ends_at || null,
        image_url: form.image_url || null,
        created_by: user!.id,
      });
      if (error) throw error;
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
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">Admin</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("admin_title")}</h1>
        </div>
        <Button onClick={() => setOpen(!open)}><Plus className="mr-1 h-4 w-4" /> {open ? t("cancel") : t("new_project")}</Button>
      </header>

      {open && (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="bg-card border border-border rounded-xl p-6 mb-8 space-y-4">
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
          </div>
          <div><Label>{t("description")}</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={create.isPending || uploading}>{t("create")}</Button></div>
        </form>
      )}

      <div className="space-y-3">
        {projects?.map((p: any) => (
          <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <button className="flex-1 text-left min-w-0" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <div className="font-semibold truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(p.starts_at), "PPP", { locale })} · {p.location || "—"} · {p.project_interests?.[0]?.count ?? 0} {t("applicants").toLowerCase()}
                </div>
              </button>
              <Button size="icon" variant="ghost" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                {expandedId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(p.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {expandedId === p.id && <ProjectAdminPanel project={p} />}
          </div>
        ))}
        {projects?.length === 0 && <p className="text-muted-foreground">—</p>}
      </div>
    </main>
  );
}

function ProjectAdminPanel({ project }: { project: any }) {
  const { t } = useI18n();
  return (
    <div className="border-t border-border bg-background/40 p-4">
      <Tabs defaultValue="applicants" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="applicants">{t("tab_applicants")}</TabsTrigger>
          <TabsTrigger value="logistics">{t("tab_logistics")}</TabsTrigger>
          <TabsTrigger value="briefing">{t("tab_briefing")}</TabsTrigger>
        </TabsList>
        <TabsContent value="applicants">
          <ApplicantsPanel projectId={project.id} />
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
              drivers_license: row.profiles.drivers_license ?? null,
            }
          : null,
      })) as ApplicantRow[];
    },
  });
}

function ApplicantsPanel({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [profileOpen, setProfileOpen] = useState<ApplicantProfile | null>(null);

  const { data: applicants, isLoading, error: queryError } = useApplicants(projectId);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("project_interests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-applicants", projectId] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">{t("applicants")}</div>
      {!isAdmin && (
        <p className="text-sm text-destructive mb-2">
          DEBUG: nuvarande användare saknar admin-rollen — RLS kan blockera hämtningen.
        </p>
      )}
      {queryError && (
        <p className="text-sm text-destructive mb-2 break-words">
          DEBUG fel: {queryError.message}
        </p>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
      {!isLoading && !queryError && (!applicants || applicants.length === 0) && (
        <p className="text-sm text-muted-foreground">{t("no_applicants")}</p>
      )}
      <ul className="space-y-2">
        {applicants?.map((a) => {
          const confirmed = a.status === "confirmed";
          const displayName = a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8);
          return (
            <li key={a.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-md px-3 py-2">
              <button
                type="button"
                className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-background/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                    <Badge
                      variant={confirmed ? "default" : "secondary"}
                      className="capitalize shrink-0"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${confirmed ? "bg-success" : "bg-yellow-500"}`} />
                      {confirmed ? t("status_confirmed") : t("status_interested")}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.profiles?.email}
                    {a.profiles?.phone && ` · ${a.profiles.phone}`}
                  </div>
                </div>
              </button>
              <Button
                size="sm"
                variant={confirmed ? "secondary" : "default"}
                onClick={() => updateStatus.mutate({ id: a.id, status: confirmed ? "interested" : "confirmed" })}
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

function ApplicantProfileModal({
  profile,
  onOpenChange,
}: {
  profile: ApplicantProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const open = !!profile;
  const rawSkills = profile?.skills ?? profile?.special_skills;
  const skills = Array.isArray(rawSkills) ? rawSkills : [];
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
                <p className="text-xs text-muted-foreground mt-0.5">{profile.occupation}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
              {t("profile_modal_contact")}
            </div>
            <div className="text-sm space-y-1">
              {profile?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a className="hover:underline" href={`mailto:${profile.email}`}>{profile.email}</a>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a className="hover:underline" href={`tel:${profile.phone}`}>{profile.phone}</a>
                </div>
              )}
              {!profile?.email && !profile?.phone && (
                <p className="text-sm text-muted-foreground">{t("profile_modal_empty")}</p>
              )}
            </div>
          </section>

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
              {t("profile_modal_about")}
            </div>
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {profile?.bio || t("profile_modal_empty")}
            </p>
          </section>

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
              {t("profile_modal_skills")}
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("profile_modal_empty")}</p>
            )}
          </section>

          <section>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-2">
              {t("profile_modal_experience")}
            </div>
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {profile?.experience || t("profile_modal_empty")}
            </p>
          </section>

          {(profile?.clothing_size || profile?.drivers_license) && (
            <section className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {profile?.clothing_size && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("clothing_size")}</div>
                  <div className="text-sm font-medium mt-0.5">{profile.clothing_size}</div>
                </div>
              )}
              {profile?.drivers_license && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("drivers_license")}</div>
                  <div className="text-sm font-medium mt-0.5">{profile.drivers_license}</div>
                </div>
              )}
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
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
        {t("logistics_title")}
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
      {!isLoading && summary.total === 0 && (
        <p className="text-sm text-muted-foreground">{t("logistics_empty")}</p>
      )}
      {summary.total > 0 && (
        <>
          <ul className="grid sm:grid-cols-2 gap-2">
            {summary.rows.map((r) => (
              <li
                key={r.label}
                className={`flex items-center justify-between bg-card border border-border rounded-md px-3 py-2 text-sm ${
                  r.missing ? "text-muted-foreground italic" : ""
                }`}
              >
                <span className="font-medium">{r.label}</span>
                <Badge variant="secondary" className="font-mono">{r.count} st</Badge>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
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

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
          {t("staff_instructions")}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{t("staff_instructions_help")}</p>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("briefing_intro")}
          className="resize-none"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {save.isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
