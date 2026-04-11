import { createClient } from "@/lib/supabase/server";
import { NewsletterComposer } from "@/components/portal/newsletters/newsletter-composer";

export default async function NewNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();

  let newsletter = null;
  if (id) {
    const { data } = await supabase
      .from("newsletters")
      .select("*")
      .eq("id", id)
      .single();
    newsletter = data;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {newsletter ? "Edit Newsletter" : "New Newsletter"}
      </h1>
      <NewsletterComposer newsletter={newsletter} />
    </div>
  );
}
