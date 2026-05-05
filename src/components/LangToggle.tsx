import { useI18n } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex items-center text-[11px] font-mono border border-border rounded-md overflow-hidden ${className}`}>
      <button
        onClick={() => setLang("sv")}
        className={`px-2 py-1 transition-colors ${lang === "sv" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        SV
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-1 transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        EN
      </button>
    </div>
  );
}
