"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import type { Lead, LeadTag, WorkflowStage } from "@/types/database";
import { addTagToLead, removeTagFromLead } from "@/actions/lead-tags";
import { updateLeadWorkflowStage } from "@/actions/workflows";
import Link from "next/link";
import { Plus, X } from "lucide-react";

interface LeadTableProps {
  data: Lead[];
  allTags: LeadTag[];
  stages: WorkflowStage[];
}

export function LeadTable({ data, allTags, stages }: LeadTableProps) {
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeTagFilter) return data;
    return data.filter((lead) =>
      lead.tags?.some((t) => t.id === activeTagFilter)
    );
  }, [data, activeTagFilter]);

  const columns = useMemo(
    () => buildColumns(allTags, stages),
    [allTags, stages]
  );

  const tagFilter = allTags.length > 0 && (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground">Filter:</span>
      {allTags.map((tag) => (
        <button
          key={tag.id}
          onClick={() =>
            setActiveTagFilter((prev) => (prev === tag.id ? null : tag.id))
          }
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border"
          style={{
            backgroundColor:
              activeTagFilter === tag.id ? tag.color : "transparent",
            color: activeTagFilter === tag.id ? "white" : undefined,
            borderColor: tag.color,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                activeTagFilter === tag.id ? "white" : tag.color,
            }}
          />
          {tag.name}
        </button>
      ))}
      {activeTagFilter && (
        <button
          onClick={() => setActiveTagFilter(null)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {tagFilter}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search leads..."
        exportCsv={{ filename: "leads" }}
      />
    </div>
  );
}

function buildColumns(
  allTags: LeadTag[],
  stages: WorkflowStage[]
): ColumnDef<Lead, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          href={`/portal/leads/${row.original.id}`}
          className="font-medium text-brand-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      id: "tags",
      header: "Tags",
      enableSorting: false,
      cell: ({ row }) => (
        <TagCell lead={row.original} allTags={allTags} />
      ),
    },
    {
      id: "stage",
      header: "Status",
      accessorFn: (row) => row.workflow_stage?.name || row.status,
      cell: ({ row }) => (
        <StatusCell lead={row.original} stages={stages} />
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.type}</span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="capitalize text-sm">
          {row.original.source.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(),
    },
  ];
}

// --- Inline Tag Editor ---

function TagCell({ lead, allTags }: { lead: Lead; allTags: LeadTag[] }) {
  const [open, setOpen] = useState(false);
  const [leadTags, setLeadTags] = useState<LeadTag[]>(lead.tags || []);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLeadTags(lead.tags || []);
  }, [lead.tags]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const tagIds = new Set(leadTags.map((t) => t.id));

  function toggle(tag: LeadTag) {
    startTransition(async () => {
      if (tagIds.has(tag.id)) {
        setLeadTags((prev) => prev.filter((t) => t.id !== tag.id));
        await removeTagFromLead(lead.id, tag.id);
      } else {
        setLeadTags((prev) => [...prev, tag]);
        await addTagToLead(lead.id, tag.id);
      }
    });
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 flex-wrap">
        {leadTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card p-1 shadow-lg">
          {allTags.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              No tags available
            </p>
          )}
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggle(tag)}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="flex-1 text-left">{tag.name}</span>
              {tagIds.has(tag.id) && (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Inline Status Dropdown ---

function StatusCell({
  lead,
  stages,
}: {
  lead: Lead;
  stages: WorkflowStage[];
}) {
  const [open, setOpen] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(
    lead.workflow_stage_id
  );
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentStageId(lead.workflow_stage_id);
  }, [lead.workflow_stage_id]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const currentStage = stages.find((s) => s.id === currentStageId);

  function selectStage(stage: WorkflowStage) {
    setOpen(false);
    startTransition(async () => {
      setCurrentStageId(stage.id);
      await updateLeadWorkflowStage(lead.id, stage.id);
    });
  }

  if (stages.length === 0) {
    return (
      <span className="capitalize text-sm">
        {lead.status.replace("_", " ")}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: currentStage?.color || "#6b7280",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-white/40"
        />
        {currentStage?.name || lead.status.replace("_", " ")}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border bg-card p-1 shadow-lg">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => selectStage(stage)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <span className="flex-1 text-left">{stage.name}</span>
              {stage.id === currentStageId && (
                <span className="text-brand-primary font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
