export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import type { Data } from "@puckeditor/core";
import { PuckRendererServer as PuckRenderer } from "@/lib/puck/renderer-server";
import { loadWebsitePage } from "@/lib/website/load-page";
import { ListingsGridConfig } from "@/lib/puck/components/ListingsGrid";

// `/listings` is now a CMS-managed Puck page (slug = "listings"). We can't
// rely on the (public)/[slug]/page.tsx catch-all here because Next gives
// literal folders routing priority — and we still need this folder for the
// `[id]` detail route. Hence this thin wrapper that resolves the same
// `listings` slug from `website_pages`.
//
// Fallback: if the seed migration hasn't run yet (or someone deleted the
// row out of band), we render a standalone ListingsGrid block with its
// default props so the URL never 404s. Same defensive posture as the home
// page fallback in (public)/page.tsx.

const LISTINGS_SLUG = "listings";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { preview } = await searchParams;
  const page = await loadWebsitePage(LISTINGS_SLUG, {
    preview: preview === "draft",
  });
  if (!page) {
    return {
      title: ListingsGridConfig.defaultProps?.heading ?? "Property Listings",
    };
  }
  return {
    title: page.title,
    description: page.meta_description ?? undefined,
  };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const page = await loadWebsitePage(LISTINGS_SLUG, {
    preview: preview === "draft",
  });

  if (page) return <PuckRenderer data={page.data} />;

  const fallbackData: Data = {
    content: [
      {
        type: "ListingsGrid",
        props: {
          id: "ListingsGrid-listings-fallback",
          ...ListingsGridConfig.defaultProps,
        },
      },
    ],
    root: { props: {} },
  };

  return <PuckRenderer data={fallbackData} />;
}
