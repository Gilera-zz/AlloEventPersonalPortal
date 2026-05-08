import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { ArrowRight, Briefcase, Calendar, Users, ExternalLink } from "lucide-react";
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
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Allo Event" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://alloevent.se"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("nav_main_site")}
            </a>
            <LangToggle />
            {user ? (
              <Button asChild size="sm"><Link to="/dashboard">{t("nav_start")} <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            ) : (
              <Button asChild size="sm"><Link to="/auth">{t("nav_login")}</Link></Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={hero} alt="" width={1600} height={900} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
          </div>
          <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.3em] text-primary mb-6">
              {t("welcome_kicker")}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
              {lang === "sv" ? <>Välkommen till <span className="text-primary">Allo Event</span></> : <>Welcome to <span className="text-primary">Allo Event</span></>}
            </h1>
            <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
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
            { icon: Briefcase, t: lang === "sv" ? "Bläddra bland projekt" : "Browse projects", d: lang === "sv" ? "Se kommande event och uppdrag." : "See upcoming events and assignments." },
            { icon: Users, t: lang === "sv" ? "Anmäl ditt intresse" : "Express your interest", d: lang === "sv" ? "Markera intresse för pass som passar dig." : "Mark interest for shifts that suit you." },
            { icon: Calendar, t: lang === "sv" ? "Hantera tillgänglighet" : "Manage availability", d: lang === "sv" ? "Berätta när du är ledig." : "Tell us when you are available." },
          ].map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()} ALLO EVENT AB · personal.alloevent.se
      </footer>
    </div>
  );
}
