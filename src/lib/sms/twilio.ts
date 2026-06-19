import twilio from "twilio";
import { isIntegrationEnabled } from "@/lib/integrations/status";

let twilioClient: ReturnType<typeof twilio> | null = null;

export function getTwilio() {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

export async function sendSMS({ to, body }: { to: string; body: string }) {
  if (!(await isIntegrationEnabled("twilio_sms"))) {
    if (process.env.NODE_ENV !== "test") {
      console.info("[sms] skipped: twilio_sms integration disabled", { to });
    }
    return null;
  }

  const client = getTwilio();
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return message;
}
