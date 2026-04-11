import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormCreateDialog } from "@/components/portal/forms/form-create-dialog";
import { ExternalLink, Edit } from "lucide-react";

export default async function FormsPage() {
  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">Build, publish, and manage forms</p>
        </div>
        <FormCreateDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forms?.map((form) => (
          <Card key={form.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{form.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">/f/{form.slug}</p>
              </div>
              <Badge variant={form.status === "published" ? "success" : "secondary"}>
                {form.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Link href={`/portal/forms/${form.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              </Link>
              {form.status === "published" && (
                <Link href={`/f/${form.slug}`} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Preview
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
