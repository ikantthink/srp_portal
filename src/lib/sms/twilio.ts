import twilio from "twilio";

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
  const client = getTwilio();
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
  return message;
}
