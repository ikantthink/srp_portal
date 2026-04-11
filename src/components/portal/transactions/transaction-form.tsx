"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import type { Transaction } from "@/types/database";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
  transaction?: Transaction;
}

export function TransactionForm({ transaction }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = transaction
      ? await updateTransaction(transaction.id, formData)
      : await createTransaction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="property_address">Property Address *</Label>
        <Input
          id="property_address"
          name="property_address"
          defaultValue={transaction?.property_address}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue={transaction?.type || "purchase"}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="purchase">Purchase</option>
            <option value="sale">Sale</option>
            <option value="lease">Lease</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={transaction?.status || "active"}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="list_price">List Price</Label>
          <Input
            id="list_price"
            name="list_price"
            type="number"
            defaultValue={transaction?.list_price ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sale_price">Sale Price</Label>
          <Input
            id="sale_price"
            name="sale_price"
            type="number"
            defaultValue={transaction?.sale_price ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="listing_date">Listing Date</Label>
          <Input
            id="listing_date"
            name="listing_date"
            type="date"
            defaultValue={transaction?.listing_date ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="closing_date">Closing Date</Label>
          <Input
            id="closing_date"
            name="closing_date"
            type="date"
            defaultValue={transaction?.closing_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={transaction?.notes ?? ""}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {transaction ? "Update Transaction" : "Create Transaction"}
      </Button>
    </form>
  );
}
