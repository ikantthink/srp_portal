"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resendInvite, revokeInvite } from "@/actions/invites";
import { Loader2 } from "lucide-react";
import type { Invite } from "@/types/database";

export function PendingInvitesList({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invites.</p>;
  }

  async function handleResend(id: string) {
    setLoadingId(id);
    setMessage(null);
    const result = await resendInvite(id);
    setLoadingId(null);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      setMessage({ type: "success", text: result.success });
      router.refresh();
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this invite?")) return;
    setLoadingId(id);
    setMessage(null);
    const result = await revokeInvite(id);
    setLoadingId(null);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message.text}
        </p>
      )}
      {invites.map((invite) => {
        const expired = new Date(invite.expires_at) < new Date();
        return (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{invite.email}</p>
                <Badge variant="secondary">{invite.role.replace("_", " ")}</Badge>
                {expired && <Badge variant="warning">Expired</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === invite.id}
                onClick={() => handleResend(invite.id)}
              >
                {loadingId === invite.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Resend
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={loadingId === invite.id}
                onClick={() => handleRevoke(invite.id)}
              >
                Revoke
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
