import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_tags")
    .select("id, name, color")
    .order("name");
  return NextResponse.json(data || []);
}
