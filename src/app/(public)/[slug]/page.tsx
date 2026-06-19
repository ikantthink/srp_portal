export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PuckRendererServer as PuckRenderer } from "@/lib/puck/renderer-server";
import { loadWebsitePage } from "@/lib/website/load-page";

// `home` is rendered at `/` (not `/home`); reserve a few slugs the catch-all
// must not steal from the static routes that still exist in /(public).
// Note: `listings` is *not* reserved because we serve it via a thin wrapper at
// (public)/listings/page.tsx (the folder has to exist for the `[id]` detail
// route, and static folders take routing priority over `[slug]`).
const RESERVED_SLUGS = new Set(["home", "blog", "f", "c", "l", "s"]);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;

  if (RESERVED_SLUGS.has(slug)) return {};

  const page = await loadWebsitePage(slug, { preview: preview === "draft" });
  if (!page) return {};

  return {
    title: page.title,
    description: page.meta_description ?? undefined,
  };
}

export default async function CMSPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  if (RESERVED_SLUGS.has(slug)) notFound();

  const page = await loadWebsitePage(slug, { preview: preview === "draft" });
  if (!page) notFound();

  return <PuckRenderer data={page.data} />;
}
