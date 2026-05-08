import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Loader2, Trash2, Upload, X, ShieldAlert, Award, Check } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: () => <RequireAuth><Profile /></RequireAuth>,
});

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const CERT_KEYS = ["b_license", "forklift", "serving_permit", "hot_works"] as const;
type CertKey = (typeof CERT_KEYS)[number];

function parseCerts(raw: string | null | undefined): Record<CertKey, boolean> {
  const base: Record<CertKey, boolean> = { b_license: false, forklift: false, serving_permit: false, hot_works: false };
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw);
    for (const k of CERT_KEYS) if (parsed[k] === true) base[k] = true;
  } catch {
    const lower = raw.trim().toLowerCase();
    if (lower === "ja" || lower === "yes" || lower === "true") {
      base.b_license = true;
    }
  }
  return base;
}

function serializeCerts(certs: Record<CertKey, boolean>): string {
  return JSON.stringify(certs);
}

function generatePersonalId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `AE-${num}`;
}

type ProfileForm = {
  full_name: string;
  personal_id: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  experience: string;
  occupation: string;
  drivers_license: string;
  clothing_size: string;
  ice_name: string;
  ice_phone: string;
  bank_name: string;
  bank_clearing: string;
  bank_account: string;
};

const EMPTY_FORM: ProfileForm = {
  full_name: "",
  personal_id: "",
  email: "",
  phone: "",
  address: "",
  bio: "",
  experience: "",
  occupation: "",
  drivers_license: "",
  clothing_size: "",
  ice_name: "",
  ice_phone: "",
  bank_name: "",
  bank_clearing: "",
  bank_account: "",
};

function Profile() {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [code, setCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [certs, setCerts] = useState<Record<CertKey, boolean>>({ b_license: false, forklift: false, serving_permit: false, hot_works: false });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const immediateRef = useRef(false);
  const gdprSetRef = useRef(false);

  const formRef = useRef(form);
  formRef.current = form;
  const certsRef = useRef(certs);
  certsRef.current = certs;
  const skillsRef = useRef(skills);
  skillsRef.current = skills;

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: existingDeleteRequest } = useQuery({
    queryKey: ["gdpr_request", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("gdpr_requests")
        .select("*")
        .eq("user_id", user!.id)
        .eq("request_type", "account_deletion")
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!profile || initialLoadDone.current) return;
    initialLoadDone.current = true;
    setForm({
      full_name: profile.full_name ?? "",
      personal_id: profile.personal_id || generatePersonalId(),
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      bio: profile.bio ?? "",
      experience: profile.experience ?? "",
      occupation: profile.occupation ?? "",
      drivers_license: profile.drivers_license ?? "",
      clothing_size: profile.clothing_size ?? "",
      ice_name: profile.ice_name ?? "",
      ice_phone: profile.ice_phone ?? "",
      bank_name: profile.bank_name ?? "",
      bank_clearing: profile.bank_clearing ?? "",
      bank_account: profile.bank_account ?? "",
    });
    setCerts(parseCerts(profile.drivers_license));
    const rawSkills = profile.skills ?? profile.special_skills;
    setSkills(Array.isArray(rawSkills) ? rawSkills : []);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.gdpr_consent) {
        gdprSetRef.current = true;
      }
    });
  }, [user]);

  const doAutoSave = useCallback(async () => {
    if (!user) return;
    const f = formRef.current;
    const c = certsRef.current;
    const s = skillsRef.current;

    if (f.phone && !/^07\d{8}$/.test(f.phone.replace(/\s|-/g, ""))) return;
    if (f.ice_phone && !/^07\d{8}$/.test(f.ice_phone.replace(/\s|-/g, ""))) return;
    if (f.bank_clearing && !/^\d{4,5}$/.test(f.bank_clearing.replace(/\s|-/g, ""))) return;
    if (f.bank_account && !/^\d{1,15}$/.test(f.bank_account.replace(/\s|-/g, ""))) return;

    setSaveStatus("saving");
    try {
      if (!gdprSetRef.current) {
        await supabase.auth.updateUser({ data: { gdpr_consent: true, gdpr_consent_at: new Date().toISOString() } });
        gdprSetRef.current = true;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          ...f,
          drivers_license: serializeCerts(c),
          skills: s,
          special_skills: s,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      setSaveStatus("saved");
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err: any) {
      setSaveStatus("idle");
      toast.error(err.message);
    }
  }, [user]);

  useEffect(() => {
    if (!initialLoadDone.current || !user) return;

    clearTimeout(debounceTimer.current);
    const delay = immediateRef.current ? 0 : 500;
    immediateRef.current = false;

    debounceTimer.current = setTimeout(doAutoSave, delay);
    return () => clearTimeout(debounceTimer.current);
  }, [form, certs, skills, doAutoSave, user]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      clearTimeout(savedTimer.current);
    };
  }, []);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const redeem = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("redeem_admin_code", { _code: code.trim() });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (ok) => {
      if (ok) {
        toast.success(t("redeem_success"));
        setCode("");
        setTimeout(() => location.reload(), 800);
      } else {
        toast.error(t("redeem_fail"));
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitDeleteRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gdpr_requests").insert({
        user_id: user!.id,
        request_type: "account_deletion",
        reason: deleteReason.trim() || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("delete_request_sent"));
      setDeleteReason("");
      qc.invalidateQueries({ queryKey: ["gdpr_request"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updErr) throw updErr;
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t("save"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user || !profile?.avatar_url) return;
    setUploading(true);
    try {
      const { data: list } = await supabase.storage.from("avatars").list(user.id);
      if (list && list.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(list.map((f) => `${user.id}/${f.name}`));
      }
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  function addSkill() {
    const v = skillInput.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setSkills((p) => [...p, v]);
    setSkillInput("");
  }

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
            {t("my_page_kicker")}
          </span>
          {saveStatus !== "idle" && (
            <div className={`flex items-center gap-2 text-sm transition-opacity ${
              saveStatus === "saving" ? "text-muted-foreground" : "text-green-500"
            }`}>
              {saveStatus === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saveStatus === "saving" ? t("saving") : t("saved")}</span>
            </div>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("my_page_title")}</h1>
        <p className="text-muted-foreground mt-2">{t("my_page_sub")}</p>
      </header>

      {/* Avatar */}
      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary mb-4">
          {t("avatar_title")}
        </div>
        <div className="flex items-center gap-5">
          <UserAvatar
            url={profile?.avatar_url}
            name={form.full_name}
            email={user?.email}
            className="h-20 w-20 ring-2 ring-primary/30"
            fallbackClassName="text-xl"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-3">{t("avatar_help")}</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> {t("upload_avatar")}
                  </>
                )}
              </Button>
              {profile?.avatar_url && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploading}
                  onClick={removeAvatar}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> {t("remove_avatar")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {/* Personal */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_personal")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field label={t("full_name")} value={form.full_name} onChange={(v) => setField("full_name", v)} />
            <div>
              <Field label={t("personal_id")} value={form.personal_id} onChange={(v) => setField("personal_id", v)} placeholder="AE-XXXX" />
              <p className="text-xs text-muted-foreground mt-1">{t("personal_id_auto_hint")}</p>
            </div>
            <Field label={t("email")} type="email" value={form.email} onChange={(v) => setField("email", v)} />
            <Field label={t("phone")} value={form.phone} onChange={(v) => setField("phone", v)} error={validationErrors.phone} />
            <div className="md:col-span-2">
              <Field label={t("address")} value={form.address} onChange={(v) => setField("address", v)} />
            </div>
          </div>
        </fieldset>

        {/* About me */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_about")}
          </legend>
          <div className="space-y-5 mt-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("bio")}
              </Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                placeholder={t("bio_help")}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("experience")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">{t("experience_help")}</p>
              <Textarea
                value={form.experience}
                onChange={(e) => setField("experience", e.target.value)}
                rows={4}
                className="mt-2 resize-none"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("special_skills")}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">{t("special_skills_help")}</p>
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Servering"
                className="mt-2"
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                    >
                      {s}
                      <button
                        type="button"
                        aria-label={`${t("remove")} ${s}`}
                        onClick={() => setSkills((p) => p.filter((x) => x !== s))}
                        className="rounded-full hover:bg-black/20 p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Work */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_work")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field label={t("occupation")} value={form.occupation} onChange={(v) => setField("occupation", v)} />
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("clothing_size")}
              </Label>
              <Select
                value={form.clothing_size || undefined}
                onValueChange={(v) => {
                  immediateRef.current = true;
                  setField("clothing_size", v);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {CLOTHING_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        {/* Certificates */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            <Award className="inline h-4 w-4 mr-1 -mt-0.5" />
            {t("group_certificates")}
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {CERT_KEYS.map((key) => {
              const selected = certs[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    immediateRef.current = true;
                    setCerts((prev) => ({ ...prev, [key]: !prev[key] }));
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {t(`cert_${key}` as any)}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Emergency contact */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_emergency")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field
              label={t("ice_name")}
              value={form.ice_name}
              onChange={(v) => setField("ice_name", v)}
            />
            <Field
              label={t("ice_phone")}
              value={form.ice_phone}
              onChange={(v) => setField("ice_phone", v)}
              error={validationErrors.ice_phone}
            />
          </div>
        </fieldset>

        {/* Payout */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_bank")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field label={t("bank_name")} value={form.bank_name} onChange={(v) => setField("bank_name", v)} />
            <Field
              label={t("bank_clearing")}
              value={form.bank_clearing}
              onChange={(v) => setField("bank_clearing", v.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              error={validationErrors.bank_clearing}
            />
            <div className="md:col-span-2">
              <Field
                label={t("bank_account")}
                value={form.bank_account}
                onChange={(v) => setField("bank_account", v.replace(/\D/g, "").slice(0, 15))}
                inputMode="numeric"
                error={validationErrors.bank_account}
              />
            </div>
          </div>
        </fieldset>

      </div>

      {!isAdmin && (
        <section className="mt-10 bg-card border border-border rounded-xl p-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            {t("redeem_admin")}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <Input
              placeholder={t("admin_code")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              onClick={() => redeem.mutate()}
              disabled={!code || redeem.isPending}
              variant="secondary"
            >
              {t("redeem")}
            </Button>
          </div>
        </section>
      )}

      {/* Privacy & GDPR */}
      <section className="mt-10 bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary">
              {t("privacy_title")}
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {t("privacy_body")}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-sm font-semibold">{t("delete_request_title")}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t("delete_request_body")}
          </p>

          {existingDeleteRequest ? (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {t("delete_request_pending")}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("delete_reason_label")}
              </Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={submitDeleteRequest.isPending}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("submit_delete_request")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("delete_request_title")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("delete_request_body")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => submitDeleteRequest.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("submit_delete_request")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </section>

      {/* GDPR footer */}
      <footer className="mt-10 mb-6 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("gdpr_footer")}
        </p>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "tel" | "text";
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
