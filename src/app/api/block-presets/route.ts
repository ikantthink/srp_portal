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
    .from("puck_block_presets")
    .select("id, name, component_type, folder, props")
    .order("folder")
    .order("name");

  return NextResponse.json(data || []);
}
