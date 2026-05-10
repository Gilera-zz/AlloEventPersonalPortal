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
  const { data: hasAdmin, error: rpcError } = await supabase.rpc("has_role", {
    _role: "admin",
    _user_id: userId,
  });
  if (!rpcError && hasAdmin === true) return "admin";

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!roleError && roleRow?.role?.toLowerCase() === "admin") return "admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>();

  if (profile?.role?.toLowerCase() === "admin") return "admin";

  return "crew";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("crew");

  const isAdmin = userRole === "admin";

  const doFetchRole = useCallback((userId: string) => {
    return fetchUserRole(userId).then(setUserRole).catch(() => setUserRole("crew"));
  }, []);

  const refreshRole = useCallback(() => {
    if (session?.user) doFetchRole(session.user.id);
  }, [session, doFetchRole]);

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUserRole("crew");
      } else if (s) {
        setSession(s);
        if (s.user) {
          setTimeout(() => { if (mounted) doFetchRole(s.user.id); }, 0);
        } else {
          setUserRole("crew");
        }
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await doFetchRole(data.session.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
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
