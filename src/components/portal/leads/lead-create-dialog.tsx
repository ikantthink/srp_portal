"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLead } from "@/actions/leads";
import { Plus, X, Loader2 } from "lucide-react";

export function LeadCreateDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createLead(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Lead
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Lead</h2>
          <button onClick={() => setOpen(false)}>
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name *</Label>
              <Input id="lead-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email *</Label>
              <Input id="lead-email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input id="lead-phone" name="phone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-type">Type</Label>
              <select
                id="lead-type"
                name="type"
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="buying">Buying</option>
                <option value="selling">Selling</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead-budget-min">Budget Min</Label>
              <Input id="lead-budget-min" name="budget_min" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-budget-max">Budget Max</Label>
              <Input id="lead-budget-max" name="budget_max" type="number" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-timeline">Timeline</Label>
            <Input id="lead-timeline" name="timeline" placeholder="e.g. 3-6 months" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea id="lead-notes" name="notes" />
          </div>
          <input type="hidden" name="source" value="manual" />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
