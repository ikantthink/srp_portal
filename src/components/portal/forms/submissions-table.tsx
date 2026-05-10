"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { FormSubmission, FormVersion } from "@/types/database";

interface FormField {
  id: string;
  label: string;
  type: string;
}

interface SubmissionsTableProps {
  submissions: FormSubmission[];
  allVersions: FormVersion[];
}

function getVersionFields(version: FormVersion): FormField[] {
  const schema = version.schema as { fields?: FormField[] } | undefined;
  return (schema?.fields || []).filter(
    (f) => f.type !== "heading" && f.type !== "paragraph"
  );
}

export function SubmissionsTable({ submissions, allVersions }: SubmissionsTableProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>("all");

  const versionMap = useMemo(
    () => new Map(allVersions.map((v) => [v.id, v])),
    [allVersions]
  );

  const versionOptions = useMemo(() => {
    const versionIds = new Set(submissions.map((s) => s.version_id));
    return allVersions.filter((v) => versionIds.has(v.id));
  }, [allVersions, submissions]);

  const filteredSubmissions = useMemo(
    () =>
      selectedVersionId === "all"
        ? submissions
        : submissions.filter((s) => s.version_id === selectedVersionId),
    [submissions, selectedVersionId]
  );

  const columns = useMemo(() => {
    let fields: FormField[];

    if (selectedVersionId !== "all") {
      const version = versionMap.get(selectedVersionId);
      fields = version ? getVersionFields(version) : [];
    } else {
      const seen = new Map<string, FormField>();
      for (const v of allVersions) {
        for (const f of getVersionFields(v)) {
          if (!seen.has(f.id)) seen.set(f.id, f);
        }
      }
      fields = Array.from(seen.values());
    }

    const cols: ColumnDef<FormSubmission, unknown>[] = [
      {
        accessorKey: "submitted_at",
        header: "Date",
        cell: ({ row }) => {
          const d = new Date(row.original.submitted_at);
          return (
            <>
              {d.toLocaleDateString()}{" "}
              <span className="text-xs text-muted-foreground">
                {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          );
        },
      },
      ...fields.map(
        (field): ColumnDef<FormSubmission, unknown> => ({
          id: field.id,
          accessorFn: (row) => {
            const val = (row.data as Record<string, unknown>)[field.id];
            return val != null ? String(val) : "";
          },
          header: field.label,
          cell: ({ getValue }) => {
            const val = getValue() as string;
            return val || <span className="text-muted-foreground/50">&mdash;</span>;
          },
        })
      ),
    ];

    if (selectedVersionId === "all") {
      cols.push({
        id: "version",
        header: "Version",
        accessorFn: (row) => {
          const v = versionMap.get(row.version_id);
          return v ? `v${v.version_number}` : row.version_id;
        },
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {getValue() as string}
          </Badge>
        ),
      });
    }

    return cols;
  }, [selectedVersionId, allVersions, versionMap]);

  const versionFilter = versionOptions.length > 1 && (
    <select
      value={selectedVersionId}
      onChange={(e) => setSelectedVersionId(e.target.value)}
      className="h-9 rounded-md border bg-background px-3 text-sm"
    >
      <option value="all">All versions</option>
      {versionOptions.map((v) => (
        <option key={v.id} value={v.id}>
          v{v.version_number} &mdash;{" "}
          {new Date(v.created_at).toLocaleDateString()}
        </option>
      ))}
    </select>
  );

  return (
    <DataTable
      columns={columns}
      data={filteredSubmissions}
      searchPlaceholder="Search submissions..."
      emptyMessage="No submissions yet."
      exportCsv={{ filename: "submissions" }}
      defaultPageSize={25}
      toolbar={versionFilter || undefined}
    />
  );
}
