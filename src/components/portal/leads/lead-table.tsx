"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/database";
import Link from "next/link";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  new: "default",
  contacted: "secondary",
  qualified: "warning",
  nurturing: "secondary",
  closed_won: "success",
  closed_lost: "destructive",
};

const columns: ColumnDef<Lead, unknown>[] = [
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
  { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "—" },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] || "secondary"}>
        {row.original.status.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="capitalize text-sm">{row.original.source.replace("_", " ")}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export function LeadTable({ data }: { data: Lead[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  );
}
