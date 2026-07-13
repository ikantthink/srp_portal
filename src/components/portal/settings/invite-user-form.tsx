"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvite } from "@/actions/invites";
import { Loader2, Mail } from "lucide-react";
import type { Role } from "@/types/database";

export function InviteUserForm({ currentRole }: { currentRole: Role }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await createInvite(formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      setMessage({ type: "success", text: result.success });
      (document.getElementById("invite-form") as HTMLFormElement)?.reset();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form id="invite-form" action={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="teammate@example.com"
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="user"
            className="flex h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            {currentRole === "super_admin" && <option value="super_admin">Super Admin</option>}
          </select>
        </div>
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Invite
        </Button>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
