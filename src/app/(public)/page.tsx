export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { PuckRenderer } from "@/lib/puck/renderer";
import type { Data } from "@puckeditor/core";
import Link from "next/link";

export default async function HomePage() {
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("puck_data")
    .eq("slug", "home")
    .eq("status", "published")
    .single();

  if (page?.puck_data) {
    return <PuckRenderer data={page.puck_data as Data} />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <span className="text-xl font-bold text-brand-primary">SRP Real Estate</span>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/about" className="text-sm hover:text-brand-primary">About</Link>
            <Link href="/listings" className="text-sm hover:text-brand-primary">Listings</Link>
            <Link href="/contact" className="text-sm hover:text-brand-primary">Contact</Link>
            <Link href="/blog" className="text-sm hover:text-brand-primary">Blog</Link>
            <Link href="/login" className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
              Agent Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[600px] items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary px-6 text-center text-white">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Find Your Dream Home
          </h1>
          <p className="text-lg text-white/90 sm:text-xl">
            Expert guidance for buyers and sellers. Let our team navigate the market for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex h-12 items-center rounded-lg bg-brand-accent px-8 font-semibold text-black">
              Get Started
            </Link>
            <Link href="/listings" className="inline-flex h-12 items-center rounded-lg bg-white/20 px-8 font-semibold backdrop-blur">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 text-center md:grid-cols-4">
          {[
            { value: "500+", label: "Homes Sold" },
            { value: "98%", label: "Client Satisfaction" },
            { value: "15+", label: "Years Experience" },
            { value: "$200M+", label: "In Sales" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-brand-primary">{s.value}</p>
              <p className="mt-1 text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground">
            Whether you&apos;re buying or selling, our team is here to help.
          </p>
          <Link href="/contact" className="inline-flex h-12 items-center rounded-lg bg-brand-primary px-8 font-semibold text-white">
            Contact Us Today
          </Link>
        </div>
      </section>

      <footer className="border-t px-6 py-12">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SRP Real Estate. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
