import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "sv" | "en";

const dict = {
  // Nav
  nav_start: { sv: "Start", en: "Start" },
  nav_projects: { sv: "Projekt", en: "Projects" },
  nav_my_projects: { sv: "Mina projekt", en: "My projects" },
  nav_my_page: { sv: "Min sida", en: "My page" },
  nav_availability: { sv: "Tillgänglighet", en: "Availability" },
  nav_admin: { sv: "Admin", en: "Admin" },
  nav_logout: { sv: "Logga ut", en: "Log out" },
  nav_login: { sv: "Logga in", en: "Log in" },
  nav_about: { sv: "Om oss", en: "About" },

  // Common
  loading: { sv: "Laddar…", en: "Loading…" },
  back: { sv: "Tillbaka", en: "Back" },
  save: { sv: "Spara ändringar", en: "Save changes" },
  saving: { sv: "Sparar…", en: "Saving…" },
  cancel: { sv: "Avbryt", en: "Cancel" },
  read_more: { sv: "Läs mer", en: "Read more" },
  show_all: { sv: "Visa alla", en: "Show all" },

  // Home
  welcome_kicker: { sv: "Personalportal", en: "Personnel portal" },
  welcome_title: { sv: "Välkommen till Allo Event", en: "Welcome to Allo Event" },
  welcome_body: {
    sv: "Vi är ett växande bemanningsföretag inom event- och servicebranschen. Här anmäler du intresse för uppdrag som passar dig — från montering och logistik till service och promotion.",
    en: "We are a growing staffing company in the event and service industry. Sign up for assignments that fit you — from build-up and logistics to service and promotion.",
  },
  hello: { sv: "Hej", en: "Hello" },
  new_projects: { sv: "Nya Projekt", en: "New Projects" },
  my_projects: { sv: "Mina projekt", en: "My projects" },
  no_active: { sv: "Inga aktiva projekt", en: "No active projects" },
  no_upcoming: { sv: "Inga kommande projekt än.", en: "No upcoming projects yet." },

  // Projects
  projects_kicker: { sv: "Möjligheter", en: "Opportunities" },
  feed_subtitle: { sv: "Anmäl intresse för kommande uppdrag.", en: "Express interest in upcoming assignments." },
  show_interest: { sv: "Visa intresse", en: "Express interest" },
  withdraw_interest: { sv: "Dra tillbaka intresse", en: "Withdraw interest" },
  interested: { sv: "Intresserad", en: "Interested" },
  positions: { sv: "platser", en: "positions" },
  dress_code: { sv: "Klädkod", en: "Dress code" },
  schedule: { sv: "Schema", en: "Schedule" },
  location_label: { sv: "Plats", en: "Location" },
  open_in_maps: { sv: "Öppna i Google Maps", en: "Open in Google Maps" },
  details: { sv: "Detaljerad brief", en: "Detailed brief" },

  // My page
  my_page_kicker: { sv: "Personalakt", en: "Personnel record" },
  my_page_title: { sv: "Min sida", en: "My page" },
  my_page_sub: {
    sv: "Håll dina uppgifter uppdaterade så vi kan matcha dig till rätt pass.",
    en: "Keep your information up to date so we can match you to the right shifts.",
  },
  group_personal: { sv: "Personliga uppgifter", en: "Personal information" },
  group_work: { sv: "Arbetsuppgifter", en: "Work details" },
  group_bank: { sv: "Bankuppgifter", en: "Bank details" },
  full_name: { sv: "Fullständigt namn", en: "Full name" },
  personal_id: { sv: "Personnummer", en: "Personal ID" },
  email: { sv: "E-post", en: "Email" },
  phone: { sv: "Telefon", en: "Phone" },
  address: { sv: "Adress", en: "Address" },
  occupation: { sv: "Sysselsättning", en: "Occupation" },
  clothing_size: { sv: "Klädstorlek", en: "Clothing size" },
  drivers_license: { sv: "Körkort", en: "Driver's license" },
  bank_clearing: { sv: "Clearingnummer", en: "Bank clearing" },
  bank_account: { sv: "Kontonummer", en: "Account number" },

  // Availability
  availability_kicker: { sv: "Schema", en: "Schedule" },
  availability_title: { sv: "Tillgänglighet", en: "Availability" },
  availability_help: {
    sv: "Klicka på en dag för att markera dig som tillgänglig. Klicka igen för att ta bort.",
    en: "Click a day to mark yourself available. Click again to remove.",
  },
  prev: { sv: "← Föregående", en: "← Previous" },
  today: { sv: "Idag", en: "Today" },
  next: { sv: "Nästa →", en: "Next →" },

  // Auth
  signin: { sv: "Logga in", en: "Sign in" },
  signup: { sv: "Skapa konto", en: "Sign up" },
  password: { sv: "Lösenord", en: "Password" },
  account_created: { sv: "Konto skapat — kolla din mejl för att bekräfta.", en: "Account created — check your email to confirm." },
  signed_in: { sv: "Inloggad", en: "Signed in" },

  // Admin
  admin_title: { sv: "Hantera projekt", en: "Manage projects" },
  new_project: { sv: "Nytt projekt", en: "New project" },
  title_label: { sv: "Titel", en: "Title" },
  category: { sv: "Kategori", en: "Category" },
  starts: { sv: "Startar", en: "Starts" },
  ends: { sv: "Slutar", en: "Ends" },
  positions_count: { sv: "Antal platser", en: "Number of positions" },
  description: { sv: "Beskrivning", en: "Description" },
  image: { sv: "Bild", en: "Image" },
  upload_image: { sv: "Ladda upp bild", en: "Upload image" },
  create: { sv: "Skapa projekt", en: "Create project" },
  applicants: { sv: "Sökande", en: "Applicants" },
  confirm: { sv: "Bekräfta", en: "Confirm" },
  unconfirm: { sv: "Ta bort bekräftelse", en: "Unconfirm" },
  delete: { sv: "Ta bort", en: "Delete" },
  no_applicants: { sv: "Inga sökande än.", en: "No applicants yet." },
  redeem_admin: { sv: "Lös in admin-kod", en: "Redeem admin code" },
  admin_code: { sv: "Admin-kod", en: "Admin code" },
  redeem: { sv: "Lös in", en: "Redeem" },
  redeem_success: { sv: "Du är nu admin! Ladda om sidan.", en: "You are now an admin! Reload the page." },
  redeem_fail: { sv: "Ogiltig eller använd kod.", en: "Invalid or already used code." },

  // Status
  status_interested: { sv: "Intresserad", en: "Interested" },
  status_confirmed: { sv: "Bekräftad", en: "Confirmed" },
  status_pending: { sv: "Väntar", en: "Pending" },
} as const;

type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "sv", setLang: () => {}, t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sv");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("allo-lang")) as Lang | null;
    if (stored === "sv" || stored === "en") {
      setLangState(stored);
    } else if (typeof navigator !== "undefined") {
      setLangState(navigator.language?.toLowerCase().startsWith("sv") ? "sv" : "en");
    }
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("allo-lang", l);
  };
  const t = (k: Key) => dict[k][lang];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
