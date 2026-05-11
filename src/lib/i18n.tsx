import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "sv" | "en";

const dict = {
  // Nav
  nav_start: { sv: "Min Dashboard", en: "My Dashboard" },
  nav_projects: { sv: "Projekt", en: "Projects" },
  nav_my_projects: { sv: "Mina projekt", en: "My projects" },
  nav_my_page: { sv: "Min sida", en: "My page" },
  nav_availability: { sv: "Tillgänglighet", en: "Availability" },
  nav_admin: { sv: "Admin", en: "Admin" },
  nav_logout: { sv: "Logga ut", en: "Log out" },
  nav_login: { sv: "Logga in", en: "Log in" },
  nav_about: { sv: "Om oss", en: "About" },
  nav_main_site: { sv: "Till huvudwebbplatsen", en: "Back to main site" },
  nav_portal_home: { sv: "Startsida", en: "Home" },
  nav_main_website: { sv: "Huvudwebbplats", en: "Main website" },
  nav_to_alloevent: { sv: "Till alloevent.se", en: "To alloevent.se" },

  // Common
  loading: { sv: "Laddar…", en: "Loading…" },
  back: { sv: "Tillbaka", en: "Back" },
  save: { sv: "Spara ändringar", en: "Save changes" },
  saved: { sv: "Sparat", en: "Saved" },
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
  show_interest: { sv: "Intresserad", en: "Interested" },
  withdraw_interest: { sv: "Dra tillbaka intresse", en: "Withdraw interest" },
  signed_up: { sv: "Anmäld", en: "Signed up" },
  signed_up_hint: { sv: "Klicka för att ta bort", en: "Click to withdraw" },
  interested: { sv: "Intresserad", en: "Interested" },
  interest_registered: { sv: "Intresseanmälan registrerad", en: "Interest registered" },
  interest_withdrawn: { sv: "Intresseanmälan borttagen", en: "Interest withdrawn" },
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
  group_bank: { sv: "Utbetalning", en: "Payout details" },
  group_emergency: { sv: "Nödkontakt", en: "Emergency contact" },
  group_about: { sv: "Om mig", en: "About me" },
  group_privacy: { sv: "Integritet & Data", en: "Privacy & Data" },
  full_name: { sv: "Fullständigt namn", en: "Full name" },
  personal_id: { sv: "Personnummer / Personal-ID", en: "Personal ID" },
  personal_id_auto_hint: { sv: "Lämna tomt för automatiskt AE-nummer", en: "Leave blank for automatic AE number" },
  email: { sv: "E-post", en: "Email" },
  phone: { sv: "Telefon", en: "Phone" },
  address: { sv: "Adress", en: "Address" },
  occupation: { sv: "Sysselsättning", en: "Occupation" },
  clothing_size: { sv: "Klädstorlek", en: "Clothing size" },
  drivers_license: { sv: "Körkort", en: "Driver's license" },
  bank_clearing: { sv: "Clearingnummer", en: "Bank clearing" },
  bank_account: { sv: "Kontonummer", en: "Account number" },
  bank_name: { sv: "Banknamn", en: "Bank name" },
  bio: { sv: "Bio", en: "Bio" },
  bio_help: {
    sv: "En kort beskrivning av dig själv — bakgrund, intressen, vad du gillar att jobba med.",
    en: "A short description of yourself — background, interests, what you like to work on.",
  },
  experience: { sv: "Erfarenhet", en: "Experience" },
  experience_help: {
    sv: "Tidigare uppdrag, arbetsplatser eller meriter som är relevanta för rollerna här.",
    en: "Previous assignments, workplaces or merits relevant to the roles here.",
  },
  special_skills: { sv: "Specialkompetenser & Behörigheter", en: "Special Skills & Certifications" },
  special_skills_help: {
    sv: "Här fyller du i allt från Truckkort och Serveringstillstånd till Ljudteknik eller Körkort.",
    en: "Add anything from forklift licenses and serving permits to sound engineering or driver's licenses.",
  },
  add_skill: { sv: "Lägg till", en: "Add" },
  skill_added: { sv: "Tillagd", en: "Added" },
  remove: { sv: "Ta bort", en: "Remove" },
  ice_name: { sv: "Namn närmast anhörig", en: "Next-of-kin name" },
  ice_phone: { sv: "Telefon närmast anhörig", en: "Next-of-kin phone" },
  avatar_title: { sv: "Profilbild", en: "Profile picture" },
  avatar_help: {
    sv: "JPG eller PNG, max 2 MB. Bilden visas i menyn och på din profil.",
    en: "JPG or PNG, max 2 MB. Shown in the menu and on your profile.",
  },
  upload_avatar: { sv: "Ladda upp bild", en: "Upload picture" },
  remove_avatar: { sv: "Ta bort bild", en: "Remove picture" },
  uploading: { sv: "Laddar upp…", en: "Uploading…" },
  privacy_title: { sv: "Integritet & Data", en: "Privacy & Data" },
  privacy_body: {
    sv: "Dina uppgifter lagras säkert hos Allo Event och används endast för att kunna planera arbetspass, betala ut lön och uppfylla våra skyldigheter som arbetsgivare. Endast behörig administration har åtkomst till dina uppgifter. Du kan när som helst begära att ditt konto raderas.",
    en: "Your information is stored securely by Allo Event and is used only to schedule shifts, pay wages and meet our obligations as an employer. Only authorised administrators can access it. You can request deletion of your account at any time.",
  },
  delete_request_title: { sv: "Begäran om radering av konto", en: "Account deletion request" },
  delete_request_body: {
    sv: "Skickar du in en begäran kontaktas du av en administratör innan ditt konto och dina personuppgifter tas bort. Eventuella anledningar nedan hjälper oss att förbättra tjänsten.",
    en: "When you submit a request an administrator will contact you before your account and personal data are removed. Optional reasons below help us improve.",
  },
  delete_reason_label: { sv: "Anledning (valfritt)", en: "Reason (optional)" },
  submit_delete_request: { sv: "Skicka begäran om radering", en: "Submit deletion request" },
  delete_request_pending: {
    sv: "En begäran om radering är registrerad och hanteras av administration.",
    en: "A deletion request has been registered and is being handled by an administrator.",
  },
  delete_request_sent: { sv: "Begäran skickad", en: "Request submitted" },

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
  status_confirmed_big: { sv: "BEKRÄFTAD", en: "CONFIRMED" },

  // Project briefing & admin tabs
  briefing_tab: { sv: "Instruktioner", en: "Instructions" },
  briefing_locked: {
    sv: "Instruktionerna blir synliga när du är bekräftad på projektet.",
    en: "Instructions become visible once you are confirmed on the project.",
  },
  briefing_empty: {
    sv: "Inga instruktioner har lagts till för det här projektet än.",
    en: "No instructions have been added for this project yet.",
  },
  briefing_intro: {
    sv: "Information från projektledningen — t.ex. samlingstid, plats och kontakt på plats.",
    en: "Information from the project lead — e.g. call time, meeting point and on-site contact.",
  },
  staff_instructions: { sv: "Instruktioner till personal", en: "Staff instructions" },
  staff_instructions_help: {
    sv: "Visas endast för bekräftad personal på projektsidan.",
    en: "Only shown to confirmed staff on the project page.",
  },
  tab_applicants: { sv: "Sökande", en: "Applicants" },
  tab_logistics: { sv: "Logistik", en: "Logistics" },
  tab_briefing: { sv: "Briefing", en: "Briefing" },
  logistics_title: { sv: "Klädstorlekar (bekräftade)", en: "Clothing sizes (confirmed)" },
  logistics_empty: {
    sv: "Ingen är bekräftad än — sammanställning visas när personal bekräftats.",
    en: "Nobody confirmed yet — the summary appears when staff are confirmed.",
  },
  logistics_missing_size: { sv: "Ingen storlek angiven", en: "No size set" },
  logistics_total: { sv: "Totalt", en: "Total" },
  view_profile: { sv: "Visa profil", en: "View profile" },
  profile_modal_contact: { sv: "Kontakt", en: "Contact" },
  profile_modal_about: { sv: "Om mig", en: "About" },
  profile_modal_skills: { sv: "Kompetenser", en: "Skills" },
  profile_modal_experience: { sv: "Erfarenhet", en: "Experience" },
  profile_modal_empty: { sv: "—", en: "—" },

  // Validation
  validation_phone_format: {
    sv: "Telefonnummer måste vara exakt 10 siffror och börja med 07.",
    en: "Phone number must be exactly 10 digits and start with 07.",
  },
  validation_bank_clearing: {
    sv: "Clearingnummer måste vara 4–5 siffror.",
    en: "Bank clearing number must be 4–5 digits.",
  },
  validation_bank_account: {
    sv: "Kontonummer får vara max 15 siffror.",
    en: "Account number must be max 15 digits.",
  },

  // Certificates
  group_certificates: { sv: "Certifikat & Körkort", en: "Certificates & Licenses" },
  cert_b_license: { sv: "B-körkort", en: "B driver's license" },
  cert_forklift: { sv: "Truckkort", en: "Forklift license" },
  cert_serving_permit: { sv: "Serveringstillstånd", en: "Serving permit" },
  cert_hot_works: { sv: "Heta Arbeten", en: "Hot works certificate" },

  // GDPR consent
  gdpr_consent_label: {
    sv: "Jag godkänner Allo Events användarvillkor och att mina personuppgifter hanteras enligt integritetspolicyn.",
    en: "I accept Allo Event's terms of use and that my personal data is handled according to the privacy policy.",
  },
  gdpr_consent_required: {
    sv: "Du måste godkänna villkoren för att fortsätta.",
    en: "You must accept the terms to continue.",
  },
  gdpr_footer: {
    sv: "Vi värnar om din integritet. För registerutdrag eller begäran om radering enligt GDPR, kontakta oss på info@alloevent.se.",
    en: "We care about your privacy. For data access requests or deletion requests under GDPR, contact us at info@alloevent.se.",
  },
  privacy_policy_link: { sv: "Integritetspolicy", en: "Privacy policy" },
  privacy_page_title: { sv: "Integritetspolicy", en: "Privacy Policy" },

  // Translation
  generate_en: { sv: "Generera engelsk version med AI", en: "Generate English version with AI" },
  generating_en: { sv: "Översätter…", en: "Translating…" },
  translation_saved: { sv: "Engelska översättningar sparade", en: "English translations saved" },
  translation_error: { sv: "Översättningen misslyckades", en: "Translation failed" },

  // Gatekeeping
  profile_incomplete_title: {
    sv: "Du behöver komplettera din profil innan du kan se och söka lediga uppdrag.",
    en: "You need to complete your profile before you can view and apply for assignments.",
  },
  profile_incomplete_cta: { sv: "Gå till profilinställningar", en: "Go to profile settings" },

  // Admin nav
  nav_manage_projects: { sv: "Hantera Projekt", en: "Manage Projects" },
  nav_admin_panel: { sv: "Admin Panel", en: "Admin Panel" },
  nav_staff_list: { sv: "Personal-lista", en: "Staff List" },

  // Admin user management
  admin_users_title: { sv: "Användarhantering", en: "User Management" },
  admin_users_kicker: { sv: "Admin Panel", en: "Admin Panel" },
  admin_users_subtitle: { sv: "Hantera roller och behörigheter för registrerade användare.", en: "Manage roles and permissions for registered users." },
  make_admin: { sv: "Gör till Admin", en: "Make Admin" },
  remove_admin: { sv: "Ta bort Admin", en: "Remove Admin" },
  role_updated: { sv: "Roll uppdaterad", en: "Role updated" },
  access_denied: { sv: "Åtkomst nekad", en: "Access denied" },
  no_users: { sv: "Inga registrerade användare.", en: "No registered users." },
  search_users: { sv: "Sök användare…", en: "Search users…" },
  role_admin: { sv: "Admin", en: "Admin" },
  role_crew: { sv: "Crew", en: "Crew" },

  // Admin staff list
  staff_list_title: { sv: "Personal", en: "Staff" },
  staff_list_kicker: { sv: "Personal-lista", en: "Staff List" },
  staff_list_subtitle: { sv: "Alla registrerade medarbetare.", en: "All registered staff members." },
  staff_confirmed: { sv: "Personal bekräftad", en: "Staff confirmed" },
  staff_unconfirmed: { sv: "Bekräftelse borttagen", en: "Confirmation removed" },
  no_staff: { sv: "Ingen personal registrerad.", en: "No staff registered." },

  // Status indicator
  toast_saved: { sv: "Sparat ✓", en: "Saved ✓" },
  availability_saved: { sv: "Tillgänglighet uppdaterad", en: "Availability updated" },
  status_all_saved: { sv: "Alla ändringar sparade", en: "All changes saved" },
  status_save_error: { sv: "Kunde inte spara. Kontrollera din anslutning.", en: "Could not save. Check your connection." },
  save_failed_skills: { sv: "Kunde inte spara kompetenser till databasen.", en: "Could not save skills to the database." },

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
