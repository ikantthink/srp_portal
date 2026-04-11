"use client";

import { useState } from "react";
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

  async function handleChange(newRole: string) {
    setRole(newRole);
    const supabase = createClient();
    await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      className="flex h-9 rounded-lg border border-border bg-background px-3 py-1 text-sm"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
      <option value="super_admin">Super Admin</option>
    </select>
  );
}
