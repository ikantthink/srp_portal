import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeInput } from "@/lib/forms/sanitize";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { form_id, version_id, data } = await request.json();

    if (!form_id || !version_id || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sanitized = sanitizeInput(data) as Record<string, unknown>;

    const supabase = createAdminClient();

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabase.from("form_submissions").insert({
      form_id,
      version_id,
      data: sanitized,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
