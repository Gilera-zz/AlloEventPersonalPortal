import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/projects")({
  component: () => <RequireAuth requireAdmin><AdminProjects /></RequireAuth>,
});

interface ApplicantRow {
  id: string;
  status: string;
  user_id: string;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
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
            {expandedId === p.id && <ApplicantsPanel projectId={p.id} />}
          </div>
        ))}
        {projects?.length === 0 && <p className="text-muted-foreground">—</p>}
      </div>
    </main>
  );
}

function ApplicantsPanel({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: applicants } = useQuery({
    queryKey: ["project-applicants", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_interests")
        .select("id,status,user_id,profiles:user_id(full_name,email,phone)")
        .eq("project_id", projectId);
      if (error) throw error;
      return data as unknown as ApplicantRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("project_interests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-applicants", projectId] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="border-t border-border bg-background/40 p-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">{t("applicants")}</div>
      {(!applicants || applicants.length === 0) && <p className="text-sm text-muted-foreground">{t("no_applicants")}</p>}
      <ul className="space-y-2">
        {applicants?.map((a) => {
          const confirmed = a.status === "confirmed";
          return (
            <li key={a.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-md px-3 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${confirmed ? "bg-success" : "bg-yellow-500"}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.profiles?.email} {a.profiles?.phone && `· ${a.profiles.phone}`}</div>
                </div>
              </div>
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
    </div>
  );
}
