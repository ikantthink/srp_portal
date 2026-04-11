import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Globe, Edit } from "lucide-react";
import { PageCreateForm } from "@/components/portal/website/page-create-form";

export default async function WebsiteCMSPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("website_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website CMS</h1>
          <p className="text-muted-foreground">
            Build and manage your marketing site pages
          </p>
        </div>
        <PageCreateForm />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages?.map((page) => (
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
            <CardContent className="flex gap-2">
              <Link href={`/portal/website/pages/${page.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
              {page.status === "published" && (
                <Link href={`/${page.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <Globe className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
        {(!pages || pages.length === 0) && (
          <p className="text-muted-foreground col-span-full">
            No pages yet. Create your first page to get started.
          </p>
        )}
      </div>
    </div>
  );
}
