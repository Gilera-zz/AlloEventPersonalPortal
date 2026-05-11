import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import logo from "@/assets/allo-logo.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ResetPasswordPage() {
  const nav = useNavigate();
  const { t } = useI18n();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error(t("password_too_short"));
    }
    if (newPassword !== confirmPassword) {
      return toast.error(t("passwords_no_match"));
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("password_updated"), {
      style: { borderColor: "rgba(212, 165, 116, 0.5)", background: "#0A0A0A", color: "#D4A574" },
    });
    setTimeout(() => nav({ to: "/auth" }), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4"><LangToggle /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="https://alloevent.se" target="_self"><img src={logo} alt="Allo Event" className="h-14 w-auto mx-auto mb-4" /></a>
          <p className="text-sm text-foreground/40 font-mono uppercase tracking-[0.3em]">{t("welcome_kicker")}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-center mb-2" style={{ fontFamily: "Urbanist, sans-serif" }}>{t("reset_password_title")}</h2>
          <p className="text-sm text-foreground/50 text-center mb-6">{t("reset_password_desc")}</p>
          {checking ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !ready ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm text-foreground/80">{t("reset_token_missing")}</p>
              </div>
              <button type="button" onClick={() => nav({ to: "/auth" })} className="text-sm text-[var(--gold)] hover:underline">{t("back_to_login")}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>{t("new_password")}</Label><Input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
              <div><Label>{t("confirm_password")}</Label><Input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner /> : t("save_new_password")}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => nav({ to: "/auth" })} className="text-sm text-[var(--gold)] hover:underline">{t("back_to_login")}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
