import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useI18n();

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {lang === "sv" ? "Tillbaka" : "Back"}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
        {lang === "sv" ? "Integritetspolicy" : "Privacy Policy"}
      </h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm leading-relaxed">
        {lang === "sv" ? (
          <>
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Personuppgiftsansvarig</h2>
              <p>
                Allo Event (&quot;vi&quot;, &quot;oss&quot;) är personuppgiftsansvarig för de
                personuppgifter som behandlas via denna plattform. Kontakta oss på{" "}
                <span className="text-primary">info@alloevent.se</span> vid frågor om din data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Vilka uppgifter vi samlar in</h2>
              <p>Vi samlar in och behandlar följande personuppgifter:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Namn, e-postadress, telefonnummer och adress</li>
                <li>Personnummer (för lönehantering och arbetsrättsliga krav)</li>
                <li>Bankuppgifter — clearingnummer och kontonummer (för löneutbetalning)</li>
                <li>Profilbild (frivilligt)</li>
                <li>Certifikat och körkort (B-körkort, truckkort, serveringstillstånd, heta arbeten)</li>
                <li>Tillgänglighet, erfarenhet, kompetenser och klädstorlek</li>
                <li>Nödkontaktinformation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Ändamål och rättslig grund</h2>
              <p>Dina personuppgifter behandlas för att:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Administrera ditt anställningsförhållande och matcha dig till uppdrag (rättslig grund: avtal)</li>
                <li>Betala ut lön och uppfylla skatte- och arbetsrättsliga skyldigheter (rättslig grund: rättslig förpliktelse)</li>
                <li>Kommunicera med dig om uppdrag och schemaändringar (rättslig grund: berättigat intresse)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Lagring och säkerhet</h2>
              <p>
                All data lagras i Supabase, en molnbaserad databastjänst med kryptering i vila och under
                transport (AES-256 och TLS 1.2+). Känslig information som personnummer och bankuppgifter
                skyddas av åtkomststyrning på radnivå (Row-Level Security) — varje användare kan enbart se
                och redigera sin egen profil. Administratörer har begränsad åtkomst för att planera uppdrag
                och hantera lön.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Lagringstid</h2>
              <p>
                Dina personuppgifter lagras så länge du har ett aktivt konto. Vid kontoborttagning raderas
                dina uppgifter inom 30 dagar, med undantag för data som vi enligt lag är skyldiga att spara
                (t.ex. bokföringsunderlag i 7 år).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Dina rättigheter</h2>
              <p>Enligt GDPR har du rätt att:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Begära tillgång till de personuppgifter vi har om dig</li>
                <li>Begära rättelse av felaktiga uppgifter</li>
                <li>Begära radering av ditt konto och dina uppgifter</li>
                <li>Invända mot viss behandling</li>
                <li>Begära dataportabilitet</li>
              </ul>
              <p>
                Du kan begära radering direkt via din profilsida. För övriga förfrågningar, kontakta oss
                på <span className="text-primary">info@alloevent.se</span>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Tillsynsmyndighet</h2>
              <p>
                Om du anser att vi behandlar dina personuppgifter felaktigt har du rätt att lämna klagomål
                till Integritetsskyddsmyndigheten (IMY), <span className="text-primary">www.imy.se</span>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Ändringar</h2>
              <p>
                Denna policy kan uppdateras. Vid väsentliga ändringar meddelar vi dig via e-post eller
                i portalen. Senast uppdaterad: maj 2026.
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Data Controller</h2>
              <p>
                Allo Event (&quot;we&quot;, &quot;us&quot;) is the data controller for personal data
                processed via this platform. Contact us at{" "}
                <span className="text-primary">info@alloevent.se</span> for questions about your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Data We Collect</h2>
              <p>We collect and process the following personal data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name, email address, phone number, and address</li>
                <li>Personal identification number (for payroll and labour law requirements)</li>
                <li>Bank details — clearing number and account number (for salary payments)</li>
                <li>Profile picture (optional)</li>
                <li>Certificates and licenses (driver&apos;s license, forklift, serving permit, hot works)</li>
                <li>Availability, experience, skills, and clothing size</li>
                <li>Emergency contact information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Purpose and Legal Basis</h2>
              <p>Your personal data is processed to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Administer your employment and match you to assignments (legal basis: contract)</li>
                <li>Pay wages and fulfil tax and employment law obligations (legal basis: legal obligation)</li>
                <li>Communicate with you about assignments and schedule changes (legal basis: legitimate interest)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Storage and Security</h2>
              <p>
                All data is stored in Supabase, a cloud-based database service with encryption at rest
                and in transit (AES-256 and TLS 1.2+). Sensitive information such as personal
                identification numbers and bank details are protected by Row-Level Security — each user
                can only view and edit their own profile. Administrators have limited access to plan
                assignments and manage payroll.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Retention Period</h2>
              <p>
                Your personal data is stored as long as you have an active account. Upon account
                deletion, your data is removed within 30 days, except for data we are legally required
                to retain (e.g. accounting records for 7 years).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p>Under GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Request access to the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Object to certain processing</li>
                <li>Request data portability</li>
              </ul>
              <p>
                You can request deletion directly from your profile page. For other requests, contact us
                at <span className="text-primary">info@alloevent.se</span>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Supervisory Authority</h2>
              <p>
                If you believe we are processing your personal data incorrectly, you have the right to
                file a complaint with the Swedish Authority for Privacy Protection (IMY),{" "}
                <span className="text-primary">www.imy.se</span>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Changes</h2>
              <p>
                This policy may be updated. For material changes, we will notify you via email or
                in the portal. Last updated: May 2026.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
