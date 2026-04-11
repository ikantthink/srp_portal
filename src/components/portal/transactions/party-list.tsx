"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addParty } from "@/actions/transactions";
import type { TransactionParty } from "@/types/database";
import { Plus, User } from "lucide-react";

export function PartyList({
  transactionId,
  parties,
}: {
  transactionId: string;
  parties: TransactionParty[];
}) {
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(formData: FormData) {
    await addParty(transactionId, formData);
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      {parties.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No parties added yet.</p>
      )}

      {parties.map((party) => (
        <div
          key={party.id}
          className="flex items-start gap-3 rounded-lg border p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{party.name}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {party.role.replace("_", " ")}
              {party.company && ` at ${party.company}`}
            </p>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              {party.email && <span>{party.email}</span>}
              {party.phone && <span>{party.phone}</span>}
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <form action={handleSubmit} className="space-y-3 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="p-name">Name *</Label>
              <Input id="p-name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-role">Role *</Label>
              <select
                id="p-role"
                name="role"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="lender">Lender</option>
                <option value="title_company">Title Company</option>
                <option value="inspector">Inspector</option>
                <option value="appraiser">Appraiser</option>
                <option value="attorney">Attorney</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" name="email" type="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" name="phone" type="tel" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="p-company">Company</Label>
            <Input id="p-company" name="company" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add Party</Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Party
        </Button>
      )}
    </div>
  );
}
