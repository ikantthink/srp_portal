"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLeadActivity } from "@/actions/leads";
import type { LeadActivity } from "@/types/database";
import { Plus, MessageSquare } from "lucide-react";

export function ActivityLog({
  leadId,
  activities,
}: {
  leadId: string;
  activities: LeadActivity[];
}) {
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(formData: FormData) {
    await addLeadActivity(leadId, formData);
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <form action={handleSubmit} className="space-y-2 rounded-lg border p-3">
          <select
            name="type"
            className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm"
          >
            <option value="note">Note</option>
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="sms">SMS</option>
            <option value="status_change">Status Change</option>
          </select>
          <Input name="description" placeholder="Description..." required />
          <div className="flex gap-2">
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      )}

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.type} &middot;{" "}
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
