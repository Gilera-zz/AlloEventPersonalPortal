import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  component: () => <RequireAuth><Profile /></RequireAuth>,
});

function Profile() {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");

  const groups: { titleKey: any; fields: { key: string; labelKey: any; type?: string; full?: boolean }[] }[] = [
    {
      titleKey: "group_personal",
      fields: [
        { key: "full_name", labelKey: "full_name" },
        { key: "personal_id", labelKey: "personal_id" },
        { key: "email", labelKey: "email", type: "email" },
        { key: "phone", labelKey: "phone" },
        { key: "address", labelKey: "address", full: true },
      ],
    },
    {
      titleKey: "group_work",
      fields: [
        { key: "occupation", labelKey: "occupation" },
        { key: "drivers_license", labelKey: "drivers_license" },
        { key: "clothing_size", labelKey: "clothing_size" },
      ],
    },
    {
      titleKey: "group_bank",
      fields: [
        { key: "bank_clearing", labelKey: "bank_clearing" },
        { key: "bank_account", labelKey: "bank_account" },
      ],
    },
  ];

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      const next: Record<string, string> = {};
      groups.flatMap((g) => g.fields).forEach((f) => (next[f.key] = (profile as any)[f.key] ?? ""));
      setForm(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ ...form, updated_at: new Date().toISOString() }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("save")); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const redeem = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("redeem_admin_code", { _code: code.trim() });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (ok) => {
      if (ok) { toast.success(t("redeem_success")); setCode(""); setTimeout(() => location.reload(), 800); }
      else toast.error(t("redeem_fail"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">{t("my_page_kicker")}</span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("my_page_title")}</h1>
        <p className="text-muted-foreground mt-2">{t("my_page_sub")}</p>
      </header>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
        {groups.map((g) => (
          <fieldset key={g.titleKey} className="bg-card border border-border rounded-xl p-6">
            <legend className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary px-2 -ml-2">
              {t(g.titleKey)}
            </legend>
            <div className="grid md:grid-cols-2 gap-5 mt-3">
              {g.fields.map((f) => (
                <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t(f.labelKey)}</Label>
                  <Input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? t("saving") : t("save")}</Button>
        </div>
      </form>

      {!isAdmin && (
        <section className="mt-10 bg-card border border-border rounded-xl p-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-muted-foreground">{t("redeem_admin")}</div>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <Input placeholder={t("admin_code")} value={code} onChange={(e) => setCode(e.target.value)} />
            <Button onClick={() => redeem.mutate()} disabled={!code || redeem.isPending} variant="secondary">
              {t("redeem")}
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
