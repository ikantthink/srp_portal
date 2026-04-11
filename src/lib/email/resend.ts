import { Resend } from "resend";

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
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: from || "SRP Real Estate <noreply@srpre.com>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) throw new Error(error.message);
  return data;
}
