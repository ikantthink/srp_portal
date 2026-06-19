import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrandThemeStyle } from "@/components/shared/brand-theme-style";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SRP Real Estate",
  description: "Your trusted real estate team portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
