"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Edit, Inbox, Trash2, Loader2 } from "lucide-react";
import { deleteForm } from "@/actions/forms";

export interface FormRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  submission_count: number;
}

function DeleteButton({ formId, formName }: { formId: string; formName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteForm(formId);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="destructive"
          size="sm"
          className="h-8 text-xs"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-muted-foreground hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

const columns: ColumnDef<FormRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/portal/forms/${row.original.id}`}
        className="font-medium text-brand-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="text-muted-foreground">/f/{row.original.slug}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "published" ? "success" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "submission_count",
    header: "Submissions",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.submission_count}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={`/portal/forms/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="h-8">
            <Edit className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
        </Link>
        {row.original.submission_count > 0 && (
          <Link href={`/portal/forms/${row.original.id}?tab=submissions`}>
            <Button variant="ghost" size="sm" className="h-8">
              <Inbox className="mr-1 h-3.5 w-3.5" /> {row.original.submission_count}
            </Button>
          </Link>
        )}
        {row.original.status === "published" && (
          <Link href={`/f/${row.original.slug}`} target="_blank">
            <Button variant="ghost" size="sm" className="h-8">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
        <DeleteButton formId={row.original.id} formName={row.original.name} />
      </div>
    ),
  },
];

interface FormTableProps {
  data: FormRow[];
  toolbar?: React.ReactNode;
}

export function FormTable({ data, toolbar }: FormTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search forms..."
      toolbar={toolbar}
      emptyMessage="No forms yet. Create one to get started."
    />
  );
}
