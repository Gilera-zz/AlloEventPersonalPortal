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
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, Upload, X, ShieldAlert, Award } from "lucide-react";

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
  emergency_contact_name: string;
  emergency_contact_phone: string;
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
  emergency_contact_name: "",
  emergency_contact_phone: "",
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
  const [gdprConsent, setGdprConsent] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      personal_id: profile.personal_id ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      bio: profile.bio ?? "",
      experience: profile.experience ?? "",
      occupation: profile.occupation ?? "",
      drivers_license: profile.drivers_license ?? "",
      clothing_size: profile.clothing_size ?? "",
      emergency_contact_name: profile.emergency_contact_name ?? "",
      emergency_contact_phone: profile.emergency_contact_phone ?? "",
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
      if (data.user?.user_metadata?.gdpr_consent) setGdprConsent(true);
    });
  }, [user]);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (form.phone && !/^07\d{8}$/.test(form.phone.replace(/\s|-/g, ""))) {
      errors.phone = t("validation_phone_format");
    }
    if (form.emergency_contact_phone && !/^07\d{8}$/.test(form.emergency_contact_phone.replace(/\s|-/g, ""))) {
      errors.emergency_contact_phone = t("validation_phone_format");
    }
    if (form.bank_clearing && !/^\d{4,5}$/.test(form.bank_clearing.replace(/\s|-/g, ""))) {
      errors.bank_clearing = t("validation_bank_clearing");
    }
    if (form.bank_account && !/^\d{1,15}$/.test(form.bank_account.replace(/\s|-/g, ""))) {
      errors.bank_account = t("validation_bank_account");
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!gdprConsent) {
        await supabase.auth.updateUser({ data: { gdpr_consent: true, gdpr_consent_at: new Date().toISOString() } });
      }
      const personalId = form.personal_id.trim() || generatePersonalId();
      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          personal_id: personalId,
          drivers_license: serializeCerts(certs),
          skills,
          special_skills: skills,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setGdprConsent(true);
      toast.success(t("save"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

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
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
          {t("my_page_kicker")}
        </span>
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!validateForm()) return;
          if (!gdprConsent) {
            toast.error(t("gdpr_consent_required"));
            return;
          }
          save.mutate();
        }}
        className="space-y-6"
      >
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
              <div className="flex gap-2 mt-2">
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
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  {t("add_skill")}
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                      {s}
                      <button
                        type="button"
                        aria-label={`${t("remove")} ${s}`}
                        onClick={() => setSkills((p) => p.filter((x) => x !== s))}
                        className="ml-1 rounded-full hover:bg-background/50 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
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
                onValueChange={(v) => setField("clothing_size", v)}
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
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {CERT_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={certs[key]}
                  onCheckedChange={(v) => setCerts((prev) => ({ ...prev, [key]: !!v }))}
                />
                <span className="text-sm">{t(`cert_${key}` as any)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Emergency contact */}
        <fieldset className="bg-card border border-border rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
            {t("group_emergency")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field
              label={t("emergency_contact_name")}
              value={form.emergency_contact_name}
              onChange={(v) => setField("emergency_contact_name", v)}
            />
            <Field
              label={t("emergency_contact_phone")}
              value={form.emergency_contact_phone}
              onChange={(v) => setField("emergency_contact_phone", v)}
              error={validationErrors.emergency_contact_phone}
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

        {/* GDPR Consent */}
        <div className="bg-card border border-border rounded-xl p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={gdprConsent}
              onCheckedChange={(v) => setGdprConsent(!!v)}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              {t("gdpr_consent_label")}{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
                {t("privacy_policy_link")}
              </a>
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>

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
