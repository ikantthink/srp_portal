import { createAdminClient } from "@/lib/supabase/admin";
import { PuckRenderer } from "@/lib/puck/renderer";
import type { Data } from "@puckeditor/core";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("slug", `blog-${slug}`)
    .eq("status", "published")
    .single();

  if (page?.puck_data) {
    return <PuckRenderer data={page.puck_data as Data} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="text-xl font-bold text-brand-primary">SRP Real Estate</Link>
        </div>
      </header>
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
