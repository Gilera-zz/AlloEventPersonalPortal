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
import { UserAvatar } from "@/components/UserAvatar";
import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Loader2, Upload, X, Award, Check, Plus, Briefcase, CalendarOff, Trash2 } from "lucide-react";
import { useSaveStatus } from "@/components/SaveStatusProvider";

export const Route = createFileRoute("/profile")({
  component: () => <RequireAuth><Profile /></RequireAuth>,
});

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const PREDEFINED_ROLES = [
  "Eventpersonal",
  "Flytt och transport",
  "Logistikarbetare",
  "Servering",
  "Sampling",
] as const;

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
  clothing_size: "",
  ice_name: "",
  ice_phone: "",
  bank_name: "",
  bank_clearing: "",
  bank_account: "",
};

function Profile() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addingSkill, setAddingSkill] = useState(false);
  const [glowingSkills, setGlowingSkills] = useState<Set<string>>(new Set());
  const [glowingRoles, setGlowingRoles] = useState<Set<string>>(new Set());
  const { reportSaving, reportSaved, reportIdle } = useSaveStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef(false);
  const skipNextSave = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const immediateRef = useRef(false);
  const gdprSetRef = useRef(false);

  const formRef = useRef(form);
  formRef.current = form;

  const skillsRef = useRef(skills);
  skillsRef.current = skills;

  const rolesRef = useRef(roles);
  rolesRef.current = roles;

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!profile || initialLoadDone.current) return;
    skipNextSave.current = true;
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
      clothing_size: profile.clothing_size ?? "",
      ice_name: profile.ice_name ?? "",
      ice_phone: profile.ice_phone ?? "",
      bank_name: profile.bank_name ?? "",
      bank_clearing: profile.bank_clearing ?? "",
      bank_account: profile.bank_account ?? "",
    });
    const rawSkills = profile.special_skills;
    setSkills(Array.isArray(rawSkills) ? rawSkills : []);
    const rawRoles = profile.roles;
    setRoles(Array.isArray(rawRoles) ? rawRoles : []);
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

    const errors: Record<string, string> = {};
    if (f.phone && !/^07\d{8}$/.test(f.phone.replace(/\s|-/g, "")))
      errors.phone = t("validation_phone_format");
    if (f.ice_phone && !/^07\d{8}$/.test(f.ice_phone.replace(/\s|-/g, "")))
      errors.ice_phone = t("validation_phone_format");
    if (f.bank_clearing && !/^\d{4,5}$/.test(f.bank_clearing.replace(/\s|-/g, "")))
      errors.bank_clearing = t("validation_bank_clearing");
    if (f.bank_account && !/^\d{1,15}$/.test(f.bank_account.replace(/\s|-/g, "")))
      errors.bank_account = t("validation_bank_account");

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    reportSaving();
    try {
      if (!gdprSetRef.current) {
        await supabase.auth.updateUser({ data: { gdpr_consent: true, gdpr_consent_at: new Date().toISOString() } });
        gdprSetRef.current = true;
      }
      const payload = {
        ...f,
        updated_at: new Date().toISOString(),
      };
      console.log("[AutoSave] Saving profile (form fields)");
      const { data: saved, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      console.log("[AutoSave] Save succeeded");
      qc.setQueryData(["profile", user.id], (old: any) =>
        old ? { ...old, ...saved } : saved,
      );
      reportSaved();
    } catch (err: any) {
      console.error("[Profile save failed]", err);
      reportIdle();
      toast.error(t("save_failed_skills"));
    }
  }, [user, reportSaving, reportSaved, reportIdle, t, qc]);

  const doAutoSaveRef = useRef(doAutoSave);
  doAutoSaveRef.current = doAutoSave;

  useEffect(() => {
    if (!initialLoadDone.current || !user) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    clearTimeout(debounceTimer.current);
    const delay = immediateRef.current ? 0 : 500;
    immediateRef.current = false;

    debounceTimer.current = setTimeout(() => doAutoSaveRef.current(), delay);
    return () => clearTimeout(debounceTimer.current);
  }, [form, user]);

  useEffect(() => {
    const flush = () => {
      clearTimeout(debounceTimer.current);
      if (initialLoadDone.current) doAutoSaveRef.current();
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, []);

  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2 MB");
      return;
    }
    setUploading(true);
    reportSaving();
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
      reportSaved();
    } catch (err: any) {
      console.error("[Avatar upload failed]", err);
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
      console.error("[Avatar remove failed]", err);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveSkillsDirect(next: string[]): Promise<boolean> {
    if (!user) return false;
    reportSaving();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          skills: next,
          special_skills: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      qc.setQueryData(["profile", user.id], (old: any) =>
        old ? { ...old, skills: next, special_skills: next } : old,
      );
      reportSaved();
      return true;
    } catch (err: any) {
      console.error("[Skills direct save failed]", err);
      toast.error(t("save_failed_skills"));
      reportIdle();
      return false;
    }
  }

  async function addSkill() {
    const v = skillInput.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkillInput("");
      return;
    }
    const prevSkills = [...skills];
    const newSkills = [...skills, v];
    setAddingSkill(true);
    setSkills(newSkills);
    setSkillInput("");
    skillsRef.current = newSkills;

    const ok = await saveSkillsDirect(newSkills);
    if (!ok) {
      setSkills(prevSkills);
      skillsRef.current = prevSkills;
    } else {
      setGlowingSkills((prev) => new Set(prev).add(v));
      setTimeout(() => setGlowingSkills((prev) => { const n = new Set(prev); n.delete(v); return n; }), 700);
    }
    setTimeout(() => setAddingSkill(false), 600);
  }

  async function saveRolesDirect(next: string[]): Promise<boolean> {
    if (!user) return false;
    reportSaving();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          roles: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      qc.setQueryData(["profile", user.id], (old: any) =>
        old ? { ...old, roles: next } : old,
      );
      reportSaved();
      return true;
    } catch (err: any) {
      console.error("[Roles direct save failed]", err);
      toast.error(t("save_failed_roles"));
      reportIdle();
      return false;
    }
  }

  async function toggleRole(role: string) {
    const prevRoles = [...roles];
    const isSelected = roles.includes(role);
    const newRoles = isSelected ? roles.filter((r) => r !== role) : [...roles, role];
    setRoles(newRoles);
    rolesRef.current = newRoles;

    const ok = await saveRolesDirect(newRoles);
    if (!ok) {
      setRoles(prevRoles);
      rolesRef.current = prevRoles;
    } else if (!isSelected) {
      setGlowingRoles((prev) => new Set(prev).add(role));
      setTimeout(() => setGlowingRoles((prev) => { const n = new Set(prev); n.delete(role); return n; }), 700);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">
          {t("my_page_kicker")}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("my_page_title")}</h1>
        <p className="text-foreground/45 mt-2">{t("my_page_sub")}</p>
      </header>

      {/* Avatar */}
      <section className="glass rounded-xl p-6 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 mb-4">
          {t("avatar_title")}
        </div>
        <div className="flex items-center gap-5">
          <UserAvatar
            url={profile?.avatar_url}
            name={form.full_name}
            email={user?.email}
            className="h-20 w-20 ring-2 ring-white/[0.12]"
            fallbackClassName="text-xl"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/45 mb-3">{t("avatar_help")}</p>
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
                  {t("remove_avatar")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {/* Personal */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
            {t("group_personal")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field label={t("full_name")} value={form.full_name} onChange={(v) => setField("full_name", v)} />
            <div>
              <Field label={t("personal_id")} value={form.personal_id} onChange={(v) => setField("personal_id", v)} placeholder="AE-XXXX" />
              <p className="text-xs text-foreground/35 mt-1">{t("personal_id_auto_hint")}</p>
            </div>
            <Field label={t("email")} type="email" value={form.email} onChange={(v) => setField("email", v)} />
            <Field label={t("phone")} value={form.phone} onChange={(v) => setField("phone", v)} error={validationErrors.phone} />
            <div className="md:col-span-2">
              <Field label={t("address")} value={form.address} onChange={(v) => setField("address", v)} />
            </div>
          </div>
        </fieldset>

        {/* About me */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
            {t("group_about")}
          </legend>
          <div className="space-y-5 mt-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-foreground/45">
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
              <Label className="text-xs uppercase tracking-wider text-foreground/45">
                {t("experience")}
              </Label>
              <p className="text-xs text-foreground/35 mt-1">{t("experience_help")}</p>
              <Textarea
                value={form.experience}
                onChange={(e) => setField("experience", e.target.value)}
                rows={4}
                className="mt-2 resize-none"
              />
            </div>
          </div>
        </fieldset>

        {/* Mina Roller */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
            <Briefcase className="inline h-4 w-4 mr-1 -mt-0.5" />
            {t("my_roles")}
          </legend>
          <p className="text-xs text-foreground/35 mt-2 mb-4">{t("my_roles_help")}</p>

          <div className="flex flex-wrap gap-2">
            {PREDEFINED_ROLES.map((role) => {
              const selected = roles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-colors cursor-pointer ${glowingRoles.has(role) ? "animate-gold-glow" : ""}`}
                  style={
                    selected
                      ? {
                          backgroundColor: "rgba(212, 165, 116, 0.15)",
                          borderColor: "rgba(212, 165, 116, 0.5)",
                          color: "var(--gold)",
                        }
                      : {
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderColor: "rgba(255, 255, 255, 0.08)",
                          color: "rgba(245, 240, 235, 0.45)",
                        }
                  }
                >
                  {role}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Specialkompetenser & Behörigheter — Unified section */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
            <Award className="inline h-4 w-4 mr-1 -mt-0.5" />
            {t("special_skills")}
          </legend>
          <p className="text-xs text-foreground/35 mt-2 mb-4">{t("special_skills_help")}</p>

          {/* Free-text skill input with button */}
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="t.ex. B-Körkort, Truckkort, Logistik…"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addSkill}
              disabled={!skillInput.trim()}
              className={`shrink-0 border font-medium transition-all ${addingSkill ? "animate-gold-glow" : ""}`}
              style={{
                backgroundColor: addingSkill ? "rgba(212, 165, 116, 0.15)" : "#0a0a0a",
                borderColor: "rgba(212, 165, 116, 0.5)",
                color: addingSkill ? "var(--gold)" : "#F5F0EB",
              }}
            >
              {addingSkill ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  {t("skill_added")}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t("add_skill")}
                </>
              )}
            </Button>
          </div>

          {/* Skill tags */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {skills.map((s) => (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${glowingSkills.has(s) ? "animate-gold-glow" : ""}`}
                  style={{
                    backgroundColor: "rgba(212, 165, 116, 0.08)",
                    borderColor: "rgba(212, 165, 116, 0.25)",
                    color: "var(--gold)",
                  }}
                >
                  {s}
                  <button
                    type="button"
                    aria-label={`${t("remove")} ${s}`}
                    onClick={async () => {
                      const prevSkills = [...skills];
                      const newSkills = skills.filter((x) => x !== s);
                      setSkills(newSkills);
                      skillsRef.current = newSkills;
                      const ok = await saveSkillsDirect(newSkills);
                      if (!ok) {
                        setSkills(prevSkills);
                        skillsRef.current = prevSkills;
                      }
                    }}
                    className="rounded-full hover:bg-white/[0.1] p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </fieldset>

        {/* Work */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
            {t("group_work")}
          </legend>
          <div className="grid md:grid-cols-2 gap-5 mt-3">
            <Field label={t("occupation")} value={form.occupation} onChange={(v) => setField("occupation", v)} />
            <div>
              <Label className="text-xs uppercase tracking-wider text-foreground/45">
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

        {/* Emergency contact */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
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

        {/* Unavailable dates */}
        <UnavailableDatesSection />

        {/* Payout */}
        <fieldset className="glass rounded-xl p-6">
          <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
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

      {/* GDPR footer */}
      <footer className="mt-10 mb-6 text-center">
        <p className="text-xs text-foreground/35 leading-relaxed">
          {t("gdpr_footer")}
        </p>
      </footer>
    </main>
  );
}

function UnavailableDatesSection() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [newDate, setNewDate] = useState("");

  const { data: unavailableDates } = useQuery({
    queryKey: ["unavailable-dates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user!.id)
        .eq("available", false)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addUnavailable = useMutation({
    mutationFn: async (date: string) => {
      const existing = await supabase
        .from("availability")
        .select("id")
        .eq("user_id", user!.id)
        .eq("date", date)
        .maybeSingle();

      if (existing.data) {
        const { error } = await supabase
          .from("availability")
          .update({ available: false })
          .eq("id", existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("availability")
          .insert({ user_id: user!.id, date, available: false });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("unavailable_saved"));
      setNewDate("");
      qc.invalidateQueries({ queryKey: ["unavailable-dates"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeUnavailable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("unavailable_removed"));
      qc.invalidateQueries({ queryKey: ["unavailable-dates"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const futureDates = (unavailableDates ?? []).filter(
    (d) => new Date(d.date) >= new Date(new Date().toISOString().split("T")[0])
  );

  return (
    <fieldset className="glass rounded-xl p-6">
      <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground/50 px-2 -ml-2">
        <CalendarOff className="inline h-4 w-4 mr-1 -mt-0.5" />
        {t("unavailable_dates")}
      </legend>
      <p className="text-xs text-foreground/35 mt-2 mb-4">{t("unavailable_dates_help")}</p>

      <div className="flex gap-2 mb-4">
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="flex-1 max-w-[200px]"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => newDate && addUnavailable.mutate(newDate)}
          disabled={!newDate || addUnavailable.isPending}
          variant="secondary"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("add_unavailable_date")}
        </Button>
      </div>

      {futureDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {futureDates.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "var(--foreground)",
              }}
            >
              {d.date}
              <button
                type="button"
                onClick={() => removeUnavailable.mutate(d.id)}
                className="rounded-full hover:bg-white/[0.1] p-0.5 transition-colors"
                aria-label={t("remove")}
              >
                <Trash2 className="h-3 w-3 text-foreground/40" />
              </button>
            </span>
          ))}
        </div>
      )}
    </fieldset>
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
      <Label className="text-xs uppercase tracking-wider text-foreground/45">{label}</Label>
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
