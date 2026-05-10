import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("puck_block_presets")
    .select("id, name, component_type, folder, props")
    .order("folder")
    .order("name");

  return NextResponse.json(data || []);
}
