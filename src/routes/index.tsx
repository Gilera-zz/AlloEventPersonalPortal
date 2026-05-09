import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ArrowRight, Briefcase, Calendar, Users } from "lucide-react";
import logo from "@/assets/allo-logo.png";
import hero from "@/assets/hero-event.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-background/85 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://alloevent.se" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
            <img src={logo} alt="Allo Event" className="h-9 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <LangToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={hero} alt="" width={1600} height={900} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
          </div>
          <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.3em] text-foreground/50 mb-6">
              {t("welcome_kicker")}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
              {lang === "sv" ? <>Välkommen till <span className="text-foreground">Allo Event</span></> : <>Welcome to <span className="text-foreground">Allo Event</span></>}
            </h1>
            <p className="mt-8 text-base md:text-lg text-foreground/45 max-w-2xl leading-relaxed">
              {t("welcome_body")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {user ? (
                <Button asChild size="lg"><Link to="/dashboard">{t("nav_start")} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : (
                <>
                  <Button asChild size="lg"><Link to="/auth">{t("nav_login")} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  <Button asChild size="lg" variant="secondary"><Link to="/about">{t("nav_about")}</Link></Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: Briefcase, t: lang === "sv" ? "Bläddra bland projekt" : "Browse Projects", d: lang === "sv" ? "Se kommande event och uppdrag." : "See upcoming events and assignments." },
            { icon: Users, t: lang === "sv" ? "Sök uppdrag" : "Available Assignments", d: lang === "sv" ? "Anmäl intresse för uppdrag som passar dig." : "Apply for assignments that suit your schedule." },
            { icon: Calendar, t: lang === "sv" ? "Min tillgänglighet" : "My Availability", d: lang === "sv" ? "Uppdatera ditt schema för att få matchande jobbförslag." : "Update your schedule to receive matching job offers." },
          ].map((f) => (
            <div key={f.t} className="glass rounded-xl p-6 hover:border-white/[0.18] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-4" style={{ color: "var(--gold)" }}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
              <p className="text-sm text-foreground/45 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-foreground/30 font-mono">
        © {new Date().getFullYear()} ALLO EVENT AB · personal.alloevent.se
      </footer>
    </div>
  );
}
