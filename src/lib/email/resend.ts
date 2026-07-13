import { Resend } from "resend";
import { isIntegrationEnabled } from "@/lib/integrations/status";

let resendInstance: Resend | null = null;

export function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  if (!(await isIntegrationEnabled("resend_email"))) {
    // Email is disabled (toggle off or RESEND_API_KEY missing). Callers like
    // form submission rely on this returning a value rather than throwing.
    if (process.env.NODE_ENV !== "test") {
      console.info("[email] skipped: resend_email integration disabled", { subject });
    }
    return null;
  }

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: from || process.env.RESEND_FROM_EMAIL || "SRP Real Estate <noreply@srprealtygroup.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}
