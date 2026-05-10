import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: string;
  refreshRole: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true, isAdmin: false, userRole: "crew", refreshRole: () => {}, signOut: async () => {},
});

async function fetchUserRole(userId: string): Promise<string> {
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleRow?.role === "admin") return "admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>();

  if (profile?.role === "admin") return "admin";

  return roleRow?.role ?? "crew";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("crew");

  const isAdmin = userRole === "admin";

  const doFetchRole = useCallback((userId: string) => {
    fetchUserRole(userId).then(setUserRole).catch(() => setUserRole("crew"));
  }, []);

  const refreshRole = useCallback(() => {
    if (session?.user) doFetchRole(session.user.id);
  }, [session, doFetchRole]);

  useEffect(() => {
    const refresh = (s: Session | null) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => doFetchRole(s.user.id), 0);
      } else {
        setUserRole("crew");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUserRole("crew");
      } else if (s) {
        refresh(s);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      refresh(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [doFetchRole]);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      isAdmin,
      userRole,
      refreshRole,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
