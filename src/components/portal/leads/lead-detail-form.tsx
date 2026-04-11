"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLead } from "@/actions/leads";
import type { Lead } from "@/types/database";
import { Loader2 } from "lucide-react";

export function LeadDetailForm({ lead }: { lead: Lead }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await updateLead(lead.id, formData);
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ld-name">Name</Label>
          <Input id="ld-name" name="name" defaultValue={lead.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ld-email">Email</Label>
          <Input id="ld-email" name="email" defaultValue={lead.email} required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ld-phone">Phone</Label>
          <Input id="ld-phone" name="phone" defaultValue={lead.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ld-status">Status</Label>
          <select
            id="ld-status"
            name="status"
            defaultValue={lead.status}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="nurturing">Nurturing</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ld-type">Type</Label>
          <select
            id="ld-type"
            name="type"
            defaultValue={lead.type}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="buying">Buying</option>
            <option value="selling">Selling</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ld-budget-min">Budget Min</Label>
          <Input id="ld-budget-min" name="budget_min" type="number" defaultValue={lead.budget_min ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ld-budget-max">Budget Max</Label>
          <Input id="ld-budget-max" name="budget_max" type="number" defaultValue={lead.budget_max ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ld-timeline">Timeline</Label>
          <Input id="ld-timeline" name="timeline" defaultValue={lead.timeline ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ld-areas">Preferred Areas</Label>
        <Input id="ld-areas" name="preferred_areas" defaultValue={lead.preferred_areas ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ld-notes">Notes</Label>
        <Textarea id="ld-notes" name="notes" defaultValue={lead.notes ?? ""} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Lead
      </Button>
    </form>
  );
}
