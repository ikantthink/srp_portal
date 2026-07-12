import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeInput } from "@/lib/forms/sanitize";
import {
  isPublishedFormVersion,
  validateSubmissionPayload,
} from "@/lib/forms/validate-submission";
import { sendEmail } from "@/lib/email/resend";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import FormResponse from "@/../emails/FormResponse";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`forms-submit:${ip}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { form_id, version_id, data } = await request.json();

    if (!form_id || !version_id || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: form } = await supabase
      .from("forms")
      .select("id, status, published_version_id, name, created_by")
      .eq("id", form_id)
      .single();

    if (!form || !isPublishedFormVersion(form, version_id)) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const { data: version } = await supabase
      .from("form_versions")
      .select("settings, schema")
      .eq("id", version_id)
      .eq("form_id", form_id)
      .single();

    if (!version) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const validated = validateSubmissionPayload(
      data as Record<string, unknown>,
      (version.schema || {}) as { fields?: Array<{ id: string; type: string; label: string; required: boolean }> }
    );
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const sanitized = sanitizeInput(validated.data) as Record<string, unknown>;

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

    // Fire-and-forget email notification + lead capture
    sendNotificationEmail(supabase, form_id, version_id, sanitized).catch(() => {});
    captureAsLead(supabase, form_id, version_id, sanitized).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendNotificationEmail(
  supabase: ReturnType<typeof createAdminClient>,
  formId: string,
  versionId: string,
  submissionData: Record<string, unknown>
) {
  const { data: form } = await supabase
    .from("forms")
    .select("name, created_by")
    .eq("id", formId)
    .single();

  if (!form) return;

  const { data: version } = await supabase
    .from("form_versions")
    .select("settings, schema")
    .eq("id", versionId)
    .single();

  const settings = (version?.settings || {}) as Record<string, unknown>;
  if (settings.notify_on_submission === false) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", form.created_by)
    .single();

  if (!profile?.email) return;

  const ccEmails = (settings.notification_cc_emails as string[]) || [];
  const recipients = [profile.email, ...ccEmails];

  const fields = ((version?.schema as Record<string, unknown>)?.fields || []) as Array<{
    id: string;
    label: string;
    type: string;
  }>;

  const labeledData: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "heading" || field.type === "paragraph") continue;
    const value = submissionData[field.id];
    if (value !== undefined && value !== null) {
      labeledData[field.label] = String(value);
    }
  }

  const html = await render(
    FormResponse({ formName: form.name, submissionData: labeledData })
  );

  await sendEmail({
    to: recipients,
    subject: `New submission: ${form.name}`,
    html,
  });
}

async function captureAsLead(
  supabase: ReturnType<typeof createAdminClient>,
  formId: string,
  versionId: string,
  submissionData: Record<string, unknown>
) {
  const { data: version } = await supabase
    .from("form_versions")
    .select("settings, schema")
    .eq("id", versionId)
    .single();

  const settings = (version?.settings || {}) as Record<string, unknown>;
  if (!settings.capture_as_lead) return;

  const fields = ((version?.schema as Record<string, unknown>)?.fields || []) as Array<{
    id: string;
    label: string;
    type: string;
  }>;

  const fieldMap = new Map(fields.map((f) => [f.id, f]));

  let name = "";
  let email = "";
  let phone = "";
  const notes: string[] = [];

  for (const [fieldId, value] of Object.entries(submissionData)) {
    const field = fieldMap.get(fieldId);
    if (!field || !value) continue;

    const label = field.label.toLowerCase();
    const strVal = String(value);

    if (!name && (label.includes("name") || label.includes("full name"))) {
      name = strVal;
    } else if (!email && (field.type === "email" || label.includes("email"))) {
      email = strVal;
    } else if (!phone && (field.type === "phone" || label.includes("phone"))) {
      phone = strVal;
    } else if (field.type !== "heading" && field.type !== "paragraph") {
      notes.push(`${field.label}: ${strVal}`);
    }
  }

  if (!name && !email) return;

  const { data: form } = await supabase
    .from("forms")
    .select("name")
    .eq("id", formId)
    .single();

  const { data: lead } = await supabase.from("leads").insert({
    name: name || "Unknown",
    email: email || "",
    phone: phone || null,
    source: "website_form",
    status: "new",
    type: (settings.lead_capture_type as string) || "buying",
    notes: notes.length > 0
      ? `Submitted via "${form?.name || "form"}":\n${notes.join("\n")}`
      : `Submitted via "${form?.name || "form"}"`,
  }).select("id").single();

  if (!lead) return;

  const tagIds = (settings.lead_capture_tag_ids as string[]) || [];
  if (tagIds.length > 0) {
    await supabase.from("lead_tag_assignments").insert(
      tagIds.map((tagId) => ({ lead_id: lead.id, tag_id: tagId }))
    );
  }
}
