import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("forms")
    .select("slug, name, status")
    .order("name");

  return NextResponse.json(
    (forms || []).map((f) => ({ slug: f.slug, name: f.name, status: f.status }))
  );
}
