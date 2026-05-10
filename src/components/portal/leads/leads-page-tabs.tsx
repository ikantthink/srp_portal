"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LeadTable } from "./lead-table";
import { LeadSettings } from "./lead-settings";
import type { Lead, LeadTag, WorkflowStage } from "@/types/database";

type Tab = "leads" | "settings";

interface LeadsPageTabsProps {
  leads: Lead[];
  tags: LeadTag[];
  workflowId: string;
  stages: WorkflowStage[];
  toolbar?: React.ReactNode;
}

export function LeadsPageTabs({
  leads,
  tags,
  workflowId,
  stages,
  toolbar,
}: LeadsPageTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("leads");

  const tabs: { key: Tab; label: string }[] = [
    { key: "leads", label: "Leads" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-brand-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "leads" && toolbar}
      </div>

      {activeTab === "leads" && (
        <LeadTable data={leads} allTags={tags} stages={stages} />
      )}

      {activeTab === "settings" && (
        <LeadSettings tags={tags} workflowId={workflowId} stages={stages} />
      )}
    </div>
  );
}
