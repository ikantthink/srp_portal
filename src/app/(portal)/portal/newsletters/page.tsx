import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Send, Users } from "lucide-react";

export default async function NewslettersPage() {
  const supabase = await createClient();

  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: subscriberCount } = await supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletters</h1>
          <p className="text-muted-foreground">
            <Users className="inline h-4 w-4 mr-1" />
            {subscriberCount || 0} active subscribers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/newsletters/subscribers">
            <Button variant="outline">Subscribers</Button>
          </Link>
          <Link href="/portal/newsletters/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New Newsletter</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {newsletters?.map((nl) => (
          <Card key={nl.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{nl.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(nl.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    nl.status === "sent" ? "success" :
                    nl.status === "scheduled" ? "warning" :
                    nl.status === "failed" ? "destructive" : "secondary"
                  }
                >
                  {nl.status}
                </Badge>
                {nl.status === "draft" && (
                  <Link href={`/portal/newsletters/new?id=${nl.id}`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
