import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Users, FileText, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: transactionCount },
    { count: leadCount },
    { count: submissionCount },
  ] = await Promise.all([
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("form_submissions").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Active Transactions",
      value: transactionCount ?? 0,
      icon: ArrowLeftRight,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "New Leads",
      value: leadCount ?? 0,
      icon: Users,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Form Submissions",
      value: submissionCount ?? 0,
      icon: FileText,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Conversion Rate",
      value: "—",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your real estate portal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent transactions yet.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No new leads yet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
