"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { NewsletterSubscriber } from "@/types/database";

const columns: ColumnDef<NewsletterSubscriber, unknown>[] = [
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "success" : "destructive"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "subscribed_at",
    header: "Subscribed",
    cell: ({ row }) => new Date(row.original.subscribed_at).toLocaleDateString(),
  },
];

export function SubscribersTable({ data }: { data: NewsletterSubscriber[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search subscribers..."
      emptyMessage="No subscribers yet."
      exportCsv={{ filename: "subscribers" }}
    />
  );
}
