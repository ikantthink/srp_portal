import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandThemeStyle } from "@/components/shared/brand-theme-style";
import { getBrandSettings } from "@/lib/brand/server";
import {
  SITE_URL,
  businessJsonLd,
  defaultTitle,
  getBusinessProfile,
  serializeJsonLd,
} from "@/lib/seo/business-profile";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [brand, profile] = await Promise.all([
    getBrandSettings(),
    getBusinessProfile(),
  ]);
  const title = defaultTitle(profile);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${profile.name}`,
    },
    description: profile.description,
    openGraph: {
      siteName: profile.name,
      locale: "en_US",
      type: "website",
      title,
      description: profile.description,
      ...(brand.logo_url ? { images: [{ url: brand.logo_url }] } : {}),
    },
    icons: brand.favicon_url ? { icon: brand.favicon_url } : undefined,
  };
}

// A `<head>` rendered from the public layout stays in the body. Crawlers
// read JSON-LD from the document head, so it has to be emitted here.
const UNINDEXED_PREFIXES = ["/portal", "/login", "/accept-invite", "/auth", "/api", "/f/"];

function isIndexedPage(pathname: string): boolean {
  return !UNINDEXED_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  let jsonLd: string | null = null;
  if (isIndexedPage(pathname)) {
    const [profile, brand] = await Promise.all([
      getBusinessProfile(),
      getBrandSettings(),
    ]);
    jsonLd = serializeJsonLd(businessJsonLd(profile, brand.logo_url));
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col">
        {/*
          Server-rendered brand CSS variables. Painted into the SSR HTML so
          blocks that read `var(--brand-primary)` (HeroFlex, Hero, Footer,
          ...) render with the correct theme color from the first byte
          instead of flashing the globals.css default and then snapping to
          the real value once the client BrandProvider hydrates.

          React 19 hoists `<style>` into <head> automatically.
        */}
        <BrandThemeStyle />
        {children}
      </body>
    </html>
  );
}
