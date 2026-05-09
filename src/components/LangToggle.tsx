import { useI18n } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex items-center text-[11px] font-mono border border-white/[0.1] rounded-md overflow-hidden ${className}`}>
      <button
        onClick={() => setLang("sv")}
        className={`px-2 py-1 transition-colors ${lang === "sv" ? "bg-white/[0.1] text-foreground" : "text-foreground/40 hover:text-foreground/70"}`}
      >
        SV
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-1 transition-colors ${lang === "en" ? "bg-white/[0.1] text-foreground" : "text-foreground/40 hover:text-foreground/70"}`}
      >
        EN
      </button>
    </div>
  );
}
