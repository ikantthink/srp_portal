import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { savePageData } from "@/actions/website";
import type { Role } from "@/types/database";

/**
 * Backstop endpoint used by the editor's beforeunload cleanup to flush a
 * pending draft via `navigator.sendBeacon`. Server actions can't be invoked
 * from a beacon (no Next route to hit), so we expose a thin POST that does
 * the same `savePageData` work and returns JSON.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const role = (roleRow?.role as Role) || "user";
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await savePageData(id, body as Record<string, unknown>);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
