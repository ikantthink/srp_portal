import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";

export type AuthResult =
  | { error: string }
  | { ok: true; userId: string; role: Role };

export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return { ok: true, userId: user.id, role: (roleRow?.role as Role) ?? "user" };
}

export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (!roles.includes(auth.role)) return { error: "Forbidden" };
  return auth;
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("admin", "super_admin");
}

export async function requireSuperAdmin(): Promise<AuthResult> {
  return requireRole("super_admin");
}
