import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/allo-logo.png";
import { LangToggle } from "@/components/LangToggle";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Allo Event" },
      { name: "description", content: "Allo Event is a growing staffing company in the event and service industry." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Allo Event" className="h-9 w-auto" />
          </Link>
          <LangToggle />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
          {lang === "sv" ? "Vår identitet" : "Our identity"}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mt-3 mb-8 tracking-tight">
          {lang === "sv" ? "Välkommen till Allo Event" : "Welcome to Allo Event"}
        </h1>
        <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
          {lang === "sv" ? (
            <>
              <p>Allo Event är ett växande bemanningsföretag inom event- och servicebranschen, som arbetar med en bred uppsättning kunder och projekt. Vi driver kontinuerligt spännande uppdrag och ger dig möjligheten att anmäla intresse för de projekt som passar dig bäst.</p>
              <p>Vårt arbete varierar och kan inkludera allt från montering och uppbyggnad av mässor och eventmiljöer till lagerarbete, logistik och lossning. Dessutom tillhandahåller vi servicepersonal såsom servitörer, värdar samt sampling- och promotionspersonal.</p>
              <p>Vi strävar efter att leverera hög kvalitet i varje uppdrag och värderar engagemang, professionalism och lagarbete.</p>
            </>
          ) : (
            <>
              <p>Allo Event is a growing staffing company in the event and service industry, working with a broad set of clients and projects. We continuously run exciting assignments and let you express interest in the projects that suit you best.</p>
              <p>Our work varies and can include everything from build-up of trade fairs and event environments to warehouse work, logistics and unloading. We also provide service staff such as waiters, hosts and sampling and promotion personnel.</p>
              <p>We strive to deliver high quality in every assignment and value engagement, professionalism and teamwork.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
