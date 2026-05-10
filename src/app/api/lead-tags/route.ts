import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_tags")
    .select("id, name, color")
    .order("name");
  return NextResponse.json(data || []);
}
