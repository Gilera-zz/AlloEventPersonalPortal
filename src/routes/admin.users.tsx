import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <RequireAuth requireAdmin>
      <AdminUsers />
    </RequireAuth>
  ),
});

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  personal_id: string | null;
  created_at: string | null;
}

function AdminUsers() {
  const { user, session } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery<UserProfile[]>({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, personal_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({
      targetUserId,
      currentRole,
    }: {
      targetUserId: string;
      currentRole: string | null;
    }) => {
      const action = currentRole === "admin" ? "revoke" : "grant";
      const res = await fetch("/api/admin-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ targetUserId, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
    },
    onSuccess: () => {
      toast.success(t("role_updated"));
      qc.invalidateQueries({ queryKey: ["admin-all-users"] });
    },
    onError: (e: Error) => toast.error(e.message || t("access_denied")),
  });

  const filtered = users?.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.personal_id?.toLowerCase().includes(q))
    );
  });

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">
          {t("admin_users_kicker")}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
          {t("admin_users_title")}
        </h1>
        <p className="text-foreground/45 mt-2">{t("admin_users_subtitle")}</p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/35" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_users")}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-foreground/40">{t("loading")}</p>
      )}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="glass rounded-xl p-8 text-center text-foreground/40 text-sm border-dashed">
          {t("no_users")}
        </div>
      )}

      <div className="space-y-2">
        {filtered?.map((u) => {
          const isTargetAdmin = u.role === "admin";
          const isSelf = u.id === user?.id;
          return (
            <div
              key={u.id}
              className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar
                  url={u.avatar_url}
                  name={u.full_name}
                  email={u.email}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {u.full_name || u.email || "—"}
                    </span>
                    {u.personal_id && (
                      <span className="text-[10px] font-mono text-foreground/35 shrink-0">
                        {u.personal_id}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground/35 truncate">
                    {u.email}
                    {u.phone && ` · ${u.phone}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={
                    isTargetAdmin
                      ? {
                          backgroundColor: "rgba(212, 165, 116, 0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(212, 165, 116, 0.25)",
                        }
                      : {
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          color: "var(--muted-foreground)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: isTargetAdmin
                        ? "var(--gold)"
                        : "var(--muted-foreground)",
                    }}
                  />
                  {isTargetAdmin ? t("role_admin") : t("role_crew")}
                </span>

                {!isSelf && (
                  <Button
                    size="sm"
                    variant={isTargetAdmin ? "secondary" : "default"}
                    disabled={toggleRole.isPending}
                    onClick={() =>
                      toggleRole.mutate({
                        targetUserId: u.id,
                        currentRole: u.role,
                      })
                    }
                  >
                    {isTargetAdmin ? (
                      <>
                        <ShieldOff className="h-3 w-3 mr-1" />
                        {t("remove_admin")}
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {t("make_admin")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
