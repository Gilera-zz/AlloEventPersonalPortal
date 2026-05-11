import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import logo from "@/assets/allo-logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function AuthPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/profile" });
  }, [user, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("signed_in"));
    nav({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile`,
        data: { full_name: fullName, gdpr_consent: true, gdpr_consent_at: new Date().toISOString() },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("account_created"));
  };

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: "https://personal.alloevent.se/reset-password",
    });
    setForgotLoading(false);
    if (error) return toast.error(error.message);
    setForgotSent(true);
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
        <div className="absolute top-4 right-4"><LangToggle /></div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <a href="https://alloevent.se" target="_self"><img src={logo} alt="Allo Event" className="h-14 w-auto mx-auto mb-4" /></a>
            <p className="text-sm text-foreground/40 font-mono uppercase tracking-[0.3em]">{t("welcome_kicker")}</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold text-center mb-2" style={{ fontFamily: "Urbanist, sans-serif" }}>{t("forgot_password_title")}</h2>
            <p className="text-sm text-foreground/50 text-center mb-6">{t("forgot_password_desc")}</p>
            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4">
                  <p className="text-sm text-foreground/80">{t("reset_link_sent")}</p>
                </div>
                <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }} className="text-sm text-[var(--gold)] hover:underline">{t("back_to_login")}</button>
              </div>
            ) : (
              <form onSubmit={sendResetLink} className="space-y-4">
                <div><Label>{t("email")}</Label><Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={forgotLoading}>
                  {forgotLoading ? <Spinner /> : t("send_reset_link")}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }} className="text-sm text-[var(--gold)] hover:underline">{t("back_to_login")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4"><LangToggle /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="https://alloevent.se" target="_self"><img src={logo} alt="Allo Event" className="h-14 w-auto mx-auto mb-4" /></a>
          <p className="text-sm text-foreground/40 font-mono uppercase tracking-[0.3em]">{t("welcome_kicker")}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">{t("signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div><Label>{t("email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>{t("password")}</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner /> : t("signin")}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-[var(--gold)] hover:underline">{t("forgot_password")}</button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div><Label>{t("full_name")}</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div><Label>{t("email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label>{t("password")}</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner /> : t("signup")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
