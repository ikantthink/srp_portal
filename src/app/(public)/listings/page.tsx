import Link from "next/link";

export default function ListingsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="text-xl font-bold text-brand-primary">SRP Real Estate</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-20 space-y-8">
        <h1 className="text-4xl font-bold">Property Listings</h1>
        <p className="text-muted-foreground">
          Property search powered by IDX / RESO API. Configure your listing provider in Super Admin settings to enable live MLS data.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                Listing Photo
              </div>
              <div className="p-4 space-y-1">
                <p className="font-semibold">$425,000</p>
                <p className="text-sm text-muted-foreground">123 Example St, City, ST 12345</p>
                <p className="text-xs text-muted-foreground">3 bed &middot; 2 bath &middot; 1,800 sqft</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
