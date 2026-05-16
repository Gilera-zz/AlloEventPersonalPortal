import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNotifications, useUnreadCount, useMarkAsRead } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { sv, enUS } from "date-fns/locale";

export function NotificationBell() {
  const { t, lang } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const { data: notifications } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const latest = (notifications ?? []).slice(0, 3);

  const handleClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
    setOpen(false);
    nav({ to: "/inkorg", search: { highlight: id } });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
          aria-label={t("notif_dropdown_title")}
        >
          <Bell className="h-5 w-5 text-foreground/55" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 inline-flex items-center justify-center h-4 min-w-4 rounded-full px-1 text-[9px] font-bold"
              style={{
                backgroundColor: "var(--gold)",
                color: "#050505",
                boxShadow: "0 0 8px rgba(212, 165, 116, 0.5), 0 0 20px rgba(212, 165, 116, 0.2)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 border-0"
        style={{
          background: "rgba(10, 10, 10, 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 165, 116, 0.08)",
        }}
      >
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {t("notif_dropdown_title")}
            </h3>
            {unreadCount > 0 && (
              <span
                className="inline-flex items-center justify-center h-5 min-w-5 rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  backgroundColor: "rgba(212, 165, 116, 0.18)",
                  color: "var(--gold)",
                  border: "1px solid rgba(212, 165, 116, 0.35)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {latest.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-foreground/15" strokeWidth={1} />
              <p className="text-sm text-foreground/40">{t("notif_no_new")}</p>
            </div>
          ) : (
            latest.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n.id, n.read)}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.04] border-b last:border-b-0"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
              >
                <div className="flex items-start gap-2.5">
                  {!n.read && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0 mt-1.5"
                      style={{
                        backgroundColor: "var(--gold)",
                        boxShadow: "0 0 6px rgba(212, 165, 116, 0.5)",
                      }}
                    />
                  )}
                  <div className={`flex-1 min-w-0 ${n.read ? "pl-[18px]" : ""}`}>
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-foreground/45 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-foreground/30 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => {
            setOpen(false);
            nav({ to: "/inkorg" });
          }}
          className="w-full px-4 py-2.5 text-center text-xs font-medium transition-colors hover:bg-white/[0.04] border-t"
          style={{
            color: "var(--gold)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          {t("notif_view_all")}
        </button>
      </PopoverContent>
    </Popover>
  );
}
