import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TransactionTable } from "@/components/portal/transactions/transaction-table";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track your real estate transactions</p>
        </div>
        <Link href="/portal/transactions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </Link>
      </div>

      <TransactionTable data={transactions || []} />
    </div>
  );
}
