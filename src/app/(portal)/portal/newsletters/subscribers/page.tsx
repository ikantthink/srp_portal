import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";

export default async function SubscribersPage() {
  const supabase = await createClient();

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
        <p className="text-muted-foreground">Manage newsletter subscribers</p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subscribers?.map((sub) => (
              <tr key={sub.id} className="border-b">
                <td className="px-4 py-3 text-sm">{sub.email}</td>
                <td className="px-4 py-3 text-sm">{sub.name || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={sub.status === "active" ? "success" : "destructive"}>
                    {sub.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(sub.subscribed_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!subscribers || subscribers.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
