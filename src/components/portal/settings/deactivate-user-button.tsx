"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deactivateUser } from "@/actions/invites";
import { Loader2 } from "lucide-react";

export function DeactivateUserButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(`Deactivate ${email}? They will lose access immediately.`)) return;
    setLoading(true);
    const result = await deactivateUser(userId);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" disabled={loading} onClick={handleClick}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      Deactivate
    </Button>
  );
}
