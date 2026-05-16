import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useNotifications, useMarkAsRead } from "@/hooks/useNotifications";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { CheckCircle2, ExternalLink, Inbox } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inkorg")({
  component: () => (
    <RequireAuth>
      <InboxPage />
    </RequireAuth>
  ),
});

function InboxPage() {
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id, {
      onSuccess: () => toast.success(t("inbox_marked_read")),
    });
  };

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">
          {t("inbox_kicker")}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
          {t("inbox_title")}
        </h1>
        <p className="text-sm text-foreground/45 mt-2">{t("inbox_subtitle")}</p>
      </header>

      {isLoading && (
        <p className="text-sm text-foreground/40">{t("loading")}</p>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-foreground/20 mb-4" strokeWidth={1} />
          <p className="text-foreground/40">{t("inbox_empty")}</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications?.map((n) => (
          <div
            key={n.id}
            className="rounded-xl p-5 transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(15px)",
              border: n.read
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(212, 165, 116, 0.3)",
              boxShadow: n.read
                ? "none"
                : "0 0 20px rgba(212, 165, 116, 0.06), inset 0 0 20px rgba(212, 165, 116, 0.02)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!n.read && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--gold)" }}
                    />
                  )}
                  <h3 className="text-sm font-semibold truncate">{n.title}</h3>
                </div>
                <p className="text-sm text-foreground/55 leading-relaxed whitespace-pre-line">
                  {n.message}
                </p>
                <div className="text-xs text-foreground/30 mt-2">
                  {format(new Date(n.created_at), "PPP · HH:mm", { locale })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
              {!n.read && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markAsRead.isPending}
                  className="text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {t("inbox_mark_read")}
                </Button>
              )}
              {n.project_id && (
                <Link to="/projects/$projectId" params={{ projectId: n.project_id }}>
                  <Button size="sm" variant="secondary" className="text-xs">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    {t("inbox_view_project")}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
