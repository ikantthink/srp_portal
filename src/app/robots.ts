import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/business-profile";

const PRIVATE_PATHS = [
  "/portal",
  "/login",
  "/accept-invite",
  "/auth",
  "/api",
  "/f/",
  "/l/",
  "/s/",
];

// Training crawlers. Search crawlers (OAI-SearchBot, Claude-SearchBot,
// Claude-User, Googlebot, Bingbot) stay on the `*` rule.
const TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "meta-externalagent",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...TRAINING_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
