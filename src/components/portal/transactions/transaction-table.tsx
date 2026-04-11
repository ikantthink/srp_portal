"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/database";
import Link from "next/link";

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  active: "default",
  pending: "warning",
  closed: "success",
  cancelled: "destructive",
};

const columns: ColumnDef<Transaction, unknown>[] = [
  {
    accessorKey: "property_address",
    header: "Property",
    cell: ({ row }) => (
      <Link
        href={`/portal/transactions/${row.original.id}`}
        className="font-medium text-brand-primary hover:underline"
      >
        {row.original.property_address}
      </Link>
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] || "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "list_price",
    header: "List Price",
    cell: ({ row }) =>
      row.original.list_price
        ? `$${Number(row.original.list_price).toLocaleString()}`
        : "—",
  },
  {
    accessorKey: "closing_date",
    header: "Closing Date",
    cell: ({ row }) => row.original.closing_date || "—",
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export function TransactionTable({ data }: { data: Transaction[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="property_address"
      searchPlaceholder="Search by address..."
    />
  );
}
