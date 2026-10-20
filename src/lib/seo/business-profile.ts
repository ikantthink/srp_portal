import { cache } from "react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandSettings } from "@/lib/brand/server";

export const BUSINESS_PROFILE_KEY = "business_profile";

const PRODUCTION_SITE_URL = "https://www.srprealtygroup.com";

/** Public origin used for canonical URLs, the sitemap, and JSON-LD. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRODUCTION_SITE_URL
).replace(/\/+$/, "");

export interface BusinessAgent {
  name: string;
  title: string;
}

export interface BusinessProfile {
  name: string;
  description: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  areasServed: string[];
  brokerage: string;
  agents: BusinessAgent[];
  sameAs: string[];
}

export const BUSINESS_PROFILE_DEFAULTS: BusinessProfile = {
  name: "SRP Realty Group",
  description:
    "SRP Realty Group helps buyers and sellers in Anchorage, Alaska.",
  phone: "(907) 602-3952",
  email: "info@srprealtygroup.com",
  street: "420 W Tudor Rd",
  city: "Anchorage",
  region: "AK",
  postalCode: "99503",
  country: "US",
  areasServed: ["Anchorage, Alaska"],
  brokerage: "Real Broker Alaska",
  agents: [{ name: "Sydney Roth-Peterson", title: "Real Estate Agent" }],
  sameAs: [],
};

export function slugToPath(slug: string): string {
  if (slug === "home") return "/";
  if (slug.startsWith("blog-") && slug.length > "blog-".length) {
    return `/blog/${encodeURIComponent(slug.slice("blog-".length))}`;
  }
  return `/${encodeURIComponent(slug)}`;
}

/** "SRP Realty Group | Anchorage, Alaska Real Estate" from the saved profile. */
export function defaultTitle(profile: BusinessProfile): string {
  const area = profile.areasServed[0]?.trim();
  if (area) return `${profile.name} | ${area} Real Estate`;
  const place = [profile.city, profile.region].filter(Boolean).join(", ");
  return place ? `${profile.name} | ${place} Real Estate` : profile.name;
}

export function parseAreas(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseAgents(text: string): BusinessAgent[] {
  return text.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const [name, ...rest] = trimmed.split("|");
    const agentName = name.trim();
    if (!agentName) return [];
    return [{ name: agentName, title: rest.join("|").trim() }];
  });
}

/** Profile URLs (Google, Zillow, social) must be https. */
export function parseProfileUrls(
  text: string
): { urls: string[] } | { error: string } {
  const urls: string[] = [];
  for (const line of text.split("\n")) {
    const value = line.trim();
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return { error: `"${value}" is not a valid URL` };
    }
    if (url.protocol !== "https:") {
      return { error: `"${value}" must start with https://` };
    }
    urls.push(url.toString());
  }
  return { urls };
}

export function normalizeBusinessProfile(value: unknown): BusinessProfile {
  const raw = asRecord(value);
  if (!raw) return BUSINESS_PROFILE_DEFAULTS;

  const name = stringField(raw.name, BUSINESS_PROFILE_DEFAULTS.name);
  return {
    name: name || BUSINESS_PROFILE_DEFAULTS.name,
    description: stringField(
      raw.description,
      BUSINESS_PROFILE_DEFAULTS.description
    ),
    phone: stringField(raw.phone, BUSINESS_PROFILE_DEFAULTS.phone),
    email: stringField(raw.email, BUSINESS_PROFILE_DEFAULTS.email),
    street: stringField(raw.street, BUSINESS_PROFILE_DEFAULTS.street),
    city: stringField(raw.city, BUSINESS_PROFILE_DEFAULTS.city),
    region: stringField(raw.region, BUSINESS_PROFILE_DEFAULTS.region),
    postalCode: stringField(
      raw.postalCode,
      BUSINESS_PROFILE_DEFAULTS.postalCode
    ),
    country: stringField(raw.country, BUSINESS_PROFILE_DEFAULTS.country) || "US",
    areasServed:
      raw.areasServed === undefined
        ? BUSINESS_PROFILE_DEFAULTS.areasServed
        : stringList(raw.areasServed),
    brokerage: stringField(raw.brokerage, BUSINESS_PROFILE_DEFAULTS.brokerage),
    agents:
      raw.agents === undefined
        ? BUSINESS_PROFILE_DEFAULTS.agents
        : agentList(raw.agents),
    sameAs:
      raw.sameAs === undefined
        ? BUSINESS_PROFILE_DEFAULTS.sameAs
        : stringList(raw.sameAs),
  };
}

export const getBusinessProfile = cache(async (): Promise<BusinessProfile> => {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("website_settings")
      .select("value")
      .eq("key", BUSINESS_PROFILE_KEY)
      .maybeSingle();

    return normalizeBusinessProfile(data?.value);
  } catch {
    return BUSINESS_PROFILE_DEFAULTS;
  }
});

export function businessJsonLd(
  profile: BusinessProfile,
  logoUrl: string | null
): Record<string, unknown> {
  const id = `${SITE_URL}/#business`;
  const logo = absoluteAsset(logoUrl);

  const address =
    profile.street || profile.city || profile.region || profile.postalCode
      ? {
          "@type": "PostalAddress",
          ...(profile.street ? { streetAddress: profile.street } : {}),
          ...(profile.city ? { addressLocality: profile.city } : {}),
          ...(profile.region ? { addressRegion: profile.region } : {}),
          ...(profile.postalCode ? { postalCode: profile.postalCode } : {}),
          addressCountry: profile.country || "US",
        }
      : undefined;

  const business: Record<string, unknown> = {
    "@type": "RealEstateAgent",
    "@id": id,
    name: profile.name,
    url: SITE_URL,
    ...(profile.description ? { description: profile.description } : {}),
    ...(logo ? { logo, image: logo } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    ...(address ? { address } : {}),
    ...(profile.areasServed.length
      ? {
          areaServed: profile.areasServed.map((name) => ({
            "@type": "Place",
            name,
          })),
        }
      : {}),
    ...(profile.sameAs.length ? { sameAs: profile.sameAs } : {}),
    ...(profile.brokerage
      ? { memberOf: { "@type": "Organization", name: profile.brokerage } }
      : {}),
  };

  const people = profile.agents
    .filter((agent) => agent.name.trim())
    .map((agent) => ({
      "@type": "Person",
      name: agent.name,
      ...(agent.title ? { jobTitle: agent.title } : {}),
      worksFor: { "@id": id },
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      business,
      ...people,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: profile.name,
        ...(profile.description ? { description: profile.description } : {}),
        publisher: { "@id": id },
      },
    ],
  };
}

/** JSON.stringify, with `<` escaped so the payload can't break out of a script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Per-page title, description, and canonical URL.
 * A child `openGraph` object replaces the root one, so site name, locale,
 * and logo are repeated here.
 */
export async function pageMetadata(
  page: { title: string; meta_description: string | null },
  path: string,
  options?: { absoluteTitle?: string }
): Promise<Metadata> {
  const [profile, brand] = await Promise.all([
    getBusinessProfile(),
    getBrandSettings(),
  ]);
  const description = page.meta_description?.trim() || undefined;
  const titled = page.title.trim();
  const title =
    options?.absoluteTitle ??
    (titled ? `${titled} | ${profile.name}` : profile.name);
  const logo = absoluteAsset(brand.logo_url);

  return {
    title: options?.absoluteTitle
      ? { absolute: options.absoluteTitle }
      : page.title,
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      siteName: profile.name,
      locale: "en_US",
      type: "website",
      url: path,
      title,
      ...(description ? { description } : {}),
      ...(logo ? { images: [{ url: logo }] } : {}),
    },
  };
}

function absoluteAsset(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function agentList(value: unknown): BusinessAgent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = asRecord(item);
    if (!raw || typeof raw.name !== "string" || !raw.name.trim()) return [];
    return [
      {
        name: raw.name.trim(),
        title: typeof raw.title === "string" ? raw.title.trim() : "",
      },
    ];
  });
}
