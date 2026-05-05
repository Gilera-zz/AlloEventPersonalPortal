import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, loading: true, isAdmin: false, signOut: async () => {},
});

async function fetchIsAdmin(userId: string): Promise<boolean> {
  // Read the freshest role straight from the profiles table — never trust a
  // cached role baked into an old session.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>();

  console.log("Inloggad användares roll:", profile?.role);

  if (profile?.role === "admin") return true;

  // Backwards compatibility with the legacy user_roles table — some accounts
  // were promoted via redeem_admin_code before the profiles.role column existed.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return !!roles?.some((r) => r.role === "admin");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const refresh = (s: Session | null) => {
      setSession(s);
      if (s?.user) {
        // Defer to next tick so we don't block onAuthStateChange.
        setTimeout(() => {
          fetchIsAdmin(s.user.id).then(setIsAdmin).catch(() => setIsAdmin(false));
        }, 0);
      } else {
        setIsAdmin(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => refresh(s));

    supabase.auth.getSession().then(({ data }) => {
      refresh(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider value={{
      user: session?.user ?? null,
      session,
      loading,
      isAdmin,
      signOut: async () => { await supabase.auth.signOut(); },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
