import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Edit, ExternalLink, Home, Navigation, Building2 } from "lucide-react";
import { PageCreateForm } from "@/components/portal/website/page-create-form";
import { PageRowActions } from "@/components/portal/website/page-row-actions";
import { ensureHomePage, ensureListingsPage } from "@/actions/website";

export default async function WebsiteCMSPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("website_pages")
    .select("*")
    .order("created_at", { ascending: false });

  let homePage = pages?.find((p) => p.slug === "home") ?? null;
  if (!homePage) {
    const result = await ensureHomePage();
    if ("id" in result) {
      const { data } = await supabase
        .from("website_pages")
        .select("*")
        .eq("id", result.id)
        .single();
      homePage = data ?? null;
    }
  }

  let listingsPage = pages?.find((p) => p.slug === "listings") ?? null;
  if (!listingsPage) {
    const result = await ensureListingsPage();
    if ("id" in result) {
      const { data } = await supabase
        .from("website_pages")
        .select("*")
        .eq("id", result.id)
        .single();
      listingsPage = data ?? null;
    }
  }

  const otherPages = (pages ?? []).filter(
    (p) => p.slug !== "home" && p.slug !== "listings"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website CMS</h1>
          <p className="text-muted-foreground">
            Build and manage your marketing site pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View live site
            </Button>
          </Link>
          <PageCreateForm />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Site Header &amp; Footer
        </h2>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Navigation className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Navigation &amp; Footer</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Shared across every public page
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/portal/website/chrome">
              <Button variant="outline" size="sm">
                <Edit className="mr-1 h-3.5 w-3.5" />
                Edit Navigation &amp; Footer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {homePage && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Home
          </h2>
          <Card className="border-brand-primary/40">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <Home className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{homePage.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    /{homePage.slug === "home" ? "" : homePage.slug}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  homePage.status === "published" ? "success" : "secondary"
                }
              >
                {homePage.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Link href={`/portal/website/pages/${homePage.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit Home
                  </Button>
                </Link>
                {homePage.status === "published" && (
                  <Link href="/" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Globe className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                )}
              </div>
              <PageRowActions
                pageId={homePage.id}
                slug={homePage.slug}
                status={homePage.status}
                title={homePage.title}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {listingsPage && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Listings
          </h2>
          <Card className="border-brand-primary/40">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{listingsPage.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    /{listingsPage.slug}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  listingsPage.status === "published" ? "success" : "secondary"
                }
              >
                {listingsPage.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Link href={`/portal/website/pages/${listingsPage.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit Listings
                  </Button>
                </Link>
                {listingsPage.status === "published" && (
                  <Link href="/listings" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Globe className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                )}
              </div>
              <PageRowActions
                pageId={listingsPage.id}
                slug={listingsPage.slug}
                status={listingsPage.status}
                title={listingsPage.title}
              />
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pages
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherPages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">{page.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">/{page.slug}</p>
                </div>
                <Badge variant={page.status === "published" ? "success" : "secondary"}>
                  {page.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/portal/website/pages/${page.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  {page.status === "published" && (
                    <Link href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Globe className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
                <PageRowActions
                  pageId={page.id}
                  slug={page.slug}
                  status={page.status}
                  title={page.title}
                />
              </CardContent>
            </Card>
          ))}
          {otherPages.length === 0 && (
            <p className="text-muted-foreground col-span-full">
              No additional pages yet. Create your first page to get started.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
