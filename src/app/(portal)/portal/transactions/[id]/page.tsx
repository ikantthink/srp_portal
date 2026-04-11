import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/portal/transactions/transaction-form";
import { MilestoneTimeline } from "@/components/portal/transactions/milestone-timeline";
import { PartyList } from "@/components/portal/transactions/party-list";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (!transaction) notFound();

  const { data: milestones } = await supabase
    .from("transaction_milestones")
    .select("*")
    .eq("transaction_id", id);

  const { data: parties } = await supabase
    .from("transaction_parties")
    .select("*")
    .eq("transaction_id", id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {transaction.property_address}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{transaction.status}</Badge>
            <span className="text-sm capitalize text-muted-foreground">
              {transaction.type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm transaction={transaction} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <PartyList
                transactionId={transaction.id}
                parties={parties || []}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline milestones={milestones || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
