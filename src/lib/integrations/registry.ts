export type IntegrationKey =
  | "google_login"
  | "twilio_sms"
  | "resend_email"
  | "listings_api"
  | "ai"
  | "youtube"
  | "google_reviews";

export interface IntegrationDef {
  key: IntegrationKey;
  label: string;
  description: string;
  envVars: string[];
  configHref?: string;
  defaultEnabled: boolean;
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "google_login",
    label: "Google Login",
    description:
      'Show "Continue with Google" on the sign-in page. Provider credentials are configured in the Supabase dashboard.',
    envVars: [],
    defaultEnabled: true,
  },
  {
    key: "resend_email",
    label: "Resend (Email)",
    description:
      "Transactional email for form notifications, magic links, and newsletters.",
    envVars: ["RESEND_API_KEY"],
    defaultEnabled: true,
  },
  {
    key: "twilio_sms",
    label: "Twilio (SMS)",
    description:
      "Outbound SMS notifications. When disabled, SMS channel options are hidden in user notification preferences.",
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    defaultEnabled: false,
  },
  {
    key: "listings_api",
    label: "IDX / RESO Listings API",
    description:
      "Powers the Featured Listings and Property Search blocks on the public site. Pick a provider and add credentials in Listings Provider.",
    envVars: [],
    configHref: "/portal/super-admin/listings",
    defaultEnabled: false,
  },
  {
    key: "ai",
    label: "AI Assistant",
    description:
      'Powers "AI Generate" in the page builder and newsletter composer.',
    envVars: ["VERCEL_AI_GATEWAY_KEY"],
    defaultEnabled: true,
  },
  {
    key: "youtube",
    label: "YouTube",
    description:
      "Powers the YouTube Feed block. Optional: without an API key the block falls back to public RSS (channel mode, ~15 latest videos, date-sorted only). To find your channel ID open YouTube → your channel → URL ends in /channel/UC… — that suffix is the ID.",
    envVars: ["YOUTUBE_API_KEY"],
    defaultEnabled: false,
  },
  {
    key: "google_reviews",
    label: "Google Reviews",
    description:
      "Powers the Testimonials block when set to Google or Merge mode. Configure API credentials and your business location in Google Reviews settings.",
    envVars: [],
    configHref: "/portal/super-admin/google-reviews",
    defaultEnabled: false,
  },
];

export function getIntegrationDef(key: IntegrationKey): IntegrationDef {
  const def = INTEGRATIONS.find((i) => i.key === key);
  if (!def) throw new Error(`Unknown integration key: ${key}`);
  return def;
}
