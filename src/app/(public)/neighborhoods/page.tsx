import { createAdminClient } from "@/lib/supabase/admin";
import { PuckRenderer } from "@/lib/puck/renderer";
import type { Data } from "@puckeditor/core";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NeighborhoodsPage() {
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("puck_data")
    .eq("slug", "neighborhoods")
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
      <main className="mx-auto max-w-4xl px-6 py-20 space-y-8">
        <h1 className="text-4xl font-bold">Neighborhood Guides</h1>
        <p className="text-muted-foreground">
          Explore the communities we serve. Create this page in the Website CMS to add neighborhood details.
        </p>
      </main>
    </div>
  );
}
