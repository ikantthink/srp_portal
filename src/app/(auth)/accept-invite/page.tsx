import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { lookupInvite } from "@/actions/invites";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const googleEnabled = await isIntegrationEnabled("google_login");
  const invite = token ? await lookupInvite(token) : null;

  let statusMessage: string | null = null;
  if (!token) {
    statusMessage = "This invite link is missing a token.";
  } else if (!invite) {
    statusMessage = "This invite link is invalid.";
  } else if (invite.status === "revoked") {
    statusMessage = "This invite has been revoked. Ask an admin to send a new one.";
  } else if (invite.status === "accepted") {
    statusMessage = "This invite has already been used. Try signing in instead.";
  } else if (new Date(invite.expires_at) < new Date()) {
    statusMessage = "This invite has expired. Ask an admin to resend it.";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary text-white">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Invited</CardTitle>
          <CardDescription>
            {statusMessage ? "Accept invite" : `Set up your account for ${invite!.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusMessage ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {statusMessage}
            </p>
          ) : (
            <AcceptInviteForm token={token!} email={invite!.email} googleEnabled={googleEnabled} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
