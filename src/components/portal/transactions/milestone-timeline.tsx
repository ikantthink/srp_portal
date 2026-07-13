"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { updateMilestone } from "@/actions/transactions";
import type { TransactionMilestone } from "@/types/database";
import { Check, Clock, SkipForward, Circle } from "lucide-react";

const milestoneLabels: Record<string, string> = {
  listing: "Listing",
  offer_received: "Offer Received",
  offer_accepted: "Offer Accepted",
  inspection: "Inspection",
  appraisal: "Appraisal",
  title_search: "Title Search",
  financing: "Financing",
  final_walkthrough: "Final Walkthrough",
  closing: "Closing",
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: Check,
  skipped: SkipForward,
};

const statusColors = {
  pending: "text-muted-foreground border-border",
  in_progress: "text-blue-600 border-blue-600 bg-blue-50",
  completed: "text-emerald-600 border-emerald-600 bg-emerald-50",
  skipped: "text-muted-foreground border-border bg-muted",
};

export function MilestoneTimeline({
  milestones,
}: {
  milestones: TransactionMilestone[];
}) {
  const sorted = [...milestones].sort((a, b) => {
    const order = [
      "listing", "offer_received", "offer_accepted", "inspection",
      "appraisal", "title_search", "financing", "final_walkthrough", "closing",
    ];
    return order.indexOf(a.milestone) - order.indexOf(b.milestone);
  });

  return (
    <div className="space-y-0">
      {sorted.map((milestone, index) => (
        <MilestoneItem
          key={milestone.id}
          milestone={milestone}
          isLast={index === sorted.length - 1}
        />
      ))}
    </div>
  );
}

function MilestoneItem({
  milestone,
  isLast,
}: {
  milestone: TransactionMilestone;
  isLast: boolean;
}) {
  const [status, setStatus] = useState(milestone.status);
  const [isPending, startTransition] = useTransition();
  const Icon = statusIcons[status];

  function cycleStatus() {
    const next =
      status === "pending"
        ? "in_progress"
        : status === "in_progress"
          ? "completed"
          : status === "completed"
            ? "skipped"
            : "pending";

    startTransition(async () => {
      setStatus(next as typeof status);
      await updateMilestone(milestone.id, { status: next });
    });
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <button
          onClick={cycleStatus}
          disabled={isPending}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50",
            statusColors[status]
          )}
          title={`Click to change status (current: ${status})`}
        >
          <Icon className="h-4 w-4" />
        </button>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[2rem]",
              status === "completed" ? "bg-emerald-300" : "bg-border"
            )}
          />
        )}
      </div>
      <div className="pb-6">
        <p className="font-medium">{milestoneLabels[milestone.milestone]}</p>
        <p className="text-sm capitalize text-muted-foreground">{status}</p>
        {milestone.completed_date && (
          <p className="text-xs text-muted-foreground">
            Completed: {milestone.completed_date}
          </p>
        )}
      </div>
    </div>
  );
}
