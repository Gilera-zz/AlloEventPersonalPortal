import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/availability")({
  component: () => <RequireAuth><Availability /></RequireAuth>,
});

function Availability() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
  const days = Array.from({ length: 28 }).map((_, i) => addDays(weekStart, i));
  const fromIso = format(days[0], "yyyy-MM-dd");
  const toIso = format(days[days.length - 1], "yyyy-MM-dd");

  const { data } = useQuery({
    queryKey: ["availability", user?.id, fromIso, toIso],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("availability").select("*")
        .eq("user_id", user!.id).gte("date", fromIso).lte("date", toIso);
      const map = new Map<string, boolean>();
      data?.forEach((r) => map.set(r.date, r.available));
      return map;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ date, current }: { date: string; current: boolean | undefined }) => {
      if (current === undefined) {
        const { error } = await supabase.from("availability").insert({ user_id: user!.id, date, available: true });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("availability").update({ available: !current })
          .eq("user_id", user!.id).eq("date", date);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const dayLabels = lang === "sv"
    ? ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]
    : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">{t("availability_kicker")}</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">{t("availability_title")}</h1>
          <p className="text-foreground/40 mt-2 text-sm">{t("availability_help")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>{t("prev")}</Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t("today")}</Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>{t("next")}</Button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map((d) => (
          <div key={d} className="text-[10px] font-mono uppercase text-foreground/35 text-center pb-1">{d}</div>
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const available = data?.get(iso);
          const isMarked = available === true;
          return (
            <button
              key={iso}
              onClick={() => toggle.mutate({ date: iso, current: available })}
              className={`aspect-square rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                isMarked
                  ? "bg-white/[0.08] border text-foreground"
                  : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] text-foreground/60"
              }`}
              style={isMarked ? { borderColor: "var(--gold)", boxShadow: "0 0 20px -8px rgba(212, 165, 116, 0.4)" } : undefined}
            >
              <span className="text-[10px] font-mono opacity-60">{format(day, "MMM", { locale })}</span>
              <span className="text-xl font-bold" style={isMarked ? { color: "var(--gold)" } : undefined}>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
