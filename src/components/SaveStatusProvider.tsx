import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";

type Status = "idle" | "saving" | "saved";

interface SaveStatusContextType {
  status: Status;
  reportSaving: () => void;
  reportSaved: () => void;
  reportIdle: () => void;
}

const SaveStatusContext = createContext<SaveStatusContextType>({
  status: "idle",
  reportSaving: () => {},
  reportSaved: () => {},
  reportIdle: () => {},
});

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>();
  const savingCount = useRef(0);

  const reportSaving = useCallback(() => {
    savingCount.current++;
    clearTimeout(fadeTimer.current);
    setStatus("saving");
  }, []);

  const reportSaved = useCallback(() => {
    savingCount.current = Math.max(0, savingCount.current - 1);
    if (savingCount.current === 0) {
      setStatus("saved");
      clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setStatus("idle"), 6000);
    }
  }, []);

  const reportIdle = useCallback(() => {
    savingCount.current = 0;
    clearTimeout(fadeTimer.current);
    setStatus("idle");
  }, []);

  return (
    <SaveStatusContext.Provider value={{ status, reportSaving, reportSaved, reportIdle }}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export const useSaveStatus = () => useContext(SaveStatusContext);

export function SaveStatusIndicator() {
  const { status } = useSaveStatus();
  const { t } = useI18n();

  return (
    <div
      className={`fixed top-16 right-4 md:top-5 md:right-8 z-30 pointer-events-none
        flex items-center gap-1.5 transition-opacity duration-500
        ${status === "idle" ? "opacity-0" : ""}
        ${status === "saving" ? "animate-pulse" : ""}
        ${status === "saved" ? "animate-save-fade" : ""}
      `}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        color: status === "saving" ? "rgba(245, 240, 235, 0.45)" : "var(--gold)",
      }}
    >
      {status === "saving" && (
        <>
          <span className="h-1 w-1 rounded-full bg-current" />
          <span>{t("saving")}</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3" strokeWidth={2} />
          <span>{t("status_all_saved")}</span>
        </>
      )}
    </div>
  );
}
