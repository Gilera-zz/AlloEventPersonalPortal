import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = serviceKey
    ? createClient(supabaseUrl, serviceKey)
    : userClient;

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let isCallerAdmin = callerProfile?.role === "admin";

  if (!isCallerAdmin) {
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    isCallerAdmin = !!callerRoles?.some((r: any) => r.role === "admin");
  }

  if (!isCallerAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId, action } = await req.json() as {
    targetUserId: string;
    action: "grant" | "revoke";
  };

  if (!targetUserId || !["grant", "revoke"].includes(action)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "grant") {
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", targetUserId);
    if (profileErr) {
      return Response.json({ error: profileErr.message }, { status: 500 });
    }

    const { data: existing } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existing) {
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", targetUserId);
      if (roleErr) {
        return Response.json({ error: roleErr.message }, { status: 500 });
      }
    } else {
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: targetUserId, role: "admin" });
      if (roleErr) {
        return Response.json({ error: roleErr.message }, { status: 500 });
      }
    }
  } else {
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ role: null })
      .eq("id", targetUserId);
    if (profileErr) {
      return Response.json({ error: profileErr.message }, { status: 500 });
    }

    const { error: roleErr } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);
    if (roleErr) {
      return Response.json({ error: roleErr.message }, { status: 500 });
    }
  }

  return Response.json({ ok: true });
};

export const config: Config = {
  path: "/api/admin-role",
  method: "POST",
};
