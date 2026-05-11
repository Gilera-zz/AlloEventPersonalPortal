import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/admin/staff")({
  component: () => (
    <RequireAuth requireAdmin>
      <AdminStaff />
    </RequireAuth>
  ),
});

interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  personal_id: string | null;
  occupation: string | null;
  clothing_size: string | null;
  skills: string[] | null;
  special_skills: string[] | null;
  created_at: string | null;
}

function AdminStaff() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data: staff, isLoading } = useQuery<StaffProfile[]>({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, avatar_url, role, personal_id, occupation, clothing_size, skills, special_skills, created_at"
        )
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as StaffProfile[];
    },
  });

  const filtered = staff?.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.personal_id?.toLowerCase().includes(q) ||
      s.occupation?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <header className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/50">
          {t("staff_list_kicker")}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
          {t("staff_list_title")}
        </h1>
        <p className="text-foreground/45 mt-2">{t("staff_list_subtitle")}</p>
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
          {t("no_staff")}
        </div>
      )}

      <div className="space-y-2">
        {filtered?.map((s) => {
          const rawSkills = s.skills ?? s.special_skills;
          const skills = Array.isArray(rawSkills) ? rawSkills : [];
          return (
            <div
              key={s.id}
              className="glass rounded-xl px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <UserAvatar
                  url={s.avatar_url}
                  name={s.full_name}
                  email={s.email}
                  className="h-11 w-11 shrink-0 ring-1 ring-white/[0.1]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {s.full_name || "—"}
                    </span>
                    {s.personal_id && (
                      <span className="text-[10px] font-mono text-foreground/30 shrink-0">
                        {s.personal_id}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                      style={
                        s.role === "admin"
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
                      {s.role === "admin" ? "Admin" : "Crew"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-foreground/40">
                    {s.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {s.email}
                      </span>
                    )}
                    {s.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {s.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {s.occupation && (
                    <span className="text-xs text-foreground/35 font-medium">
                      {s.occupation}
                    </span>
                  )}
                  {s.clothing_size && (
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-foreground/40">
                      {s.clothing_size}
                    </span>
                  )}
                </div>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pl-15">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: "rgba(212, 165, 116, 0.08)",
                        borderColor: "rgba(212, 165, 116, 0.25)",
                        border: "1px solid rgba(212, 165, 116, 0.25)",
                        color: "var(--gold)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
