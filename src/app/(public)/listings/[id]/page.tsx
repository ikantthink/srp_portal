import Link from "next/link";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="text-xl font-bold text-brand-primary">SRP Real Estate</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-20 space-y-8">
        <div className="aspect-video rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
          Listing Photos (ID: {id})
        </div>
        <h1 className="text-3xl font-bold">Property Listing</h1>
        <p className="text-muted-foreground">
          Listing detail page. Connect your IDX/RESO provider in Super Admin to display real property data.
        </p>
      </main>
    </div>
  );
}
