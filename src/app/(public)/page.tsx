export const dynamic = "force-dynamic";

import { PuckRendererServer as PuckRenderer } from "@/lib/puck/renderer-server";
import { loadWebsitePage } from "@/lib/website/load-page";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const page = await loadWebsitePage("home", { preview: preview === "draft" });

  if (page) {
    return <PuckRenderer data={page.data} />;
  }

  // Fallback used only when the home row was somehow lost; the editor seeds
  // it via ensureHomePage, but we don't want a hard 404 on the bare domain.
  return (
    <div className="min-h-screen">
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
    </div>
  );
}
