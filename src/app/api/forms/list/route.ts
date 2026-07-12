import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("forms")
    .select("slug, name, status")
    .order("name");

  return NextResponse.json(
    (forms || []).map((f) => ({ slug: f.slug, name: f.name, status: f.status }))
  );
}
