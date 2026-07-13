"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types/database";

export function UserRoleManager({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();

  function handleChange(newRole: string) {
    startTransition(async () => {
      setRole(newRole);
      const supabase = createClient();
      await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
    });
  }

  return (
    <select
      value={role}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className="flex h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm disabled:opacity-50"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
      <option value="super_admin">Super Admin</option>
    </select>
  );
}
