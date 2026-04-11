export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { PuckRenderer } from "@/lib/puck/renderer";
import type { Data } from "@puckeditor/core";
import Link from "next/link";

export default async function ContactPage() {
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("puck_data")
    .eq("slug", "contact")
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
      <main className="mx-auto max-w-2xl px-6 py-20 space-y-8">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground">
          Get in touch with our team. Customize this page in the Website CMS.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="font-medium">Phone</p>
            <p className="text-muted-foreground">(555) 123-4567</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium">Email</p>
            <p className="text-muted-foreground">info@srpre.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
