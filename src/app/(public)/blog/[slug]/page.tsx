export const dynamic = "force-dynamic";

import { PuckRendererServer as PuckRenderer } from "@/lib/puck/renderer-server";
import { loadWebsitePage } from "@/lib/website/load-page";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadWebsitePage(`blog-${slug}`);
  if (!page) return { title: "Blog" };
  return {
    title: page.title,
    description: page.meta_description ?? undefined,
  };
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const page = await loadWebsitePage(`blog-${slug}`, {
    preview: preview === "draft",
  });

  if (page) {
    return <PuckRenderer data={page.data} />;
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-6 py-20 space-y-8">
        <Link href="/blog" className="text-sm text-brand-primary hover:underline">&larr; Back to Blog</Link>
        <h1 className="text-4xl font-bold">Blog Post</h1>
        <p className="text-muted-foreground">
          This post hasn&apos;t been published yet. Create it in the Website CMS with slug &quot;blog-{slug}&quot;.
        </p>
      </main>
    </div>
  );
}
