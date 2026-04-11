import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Link href="/" className="text-xl font-bold text-brand-primary">SRP Real Estate</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-20 space-y-8">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="text-muted-foreground">
          Real estate news, market updates, and tips. Blog content can be managed through the Website CMS.
        </p>
      </main>
    </div>
  );
}
