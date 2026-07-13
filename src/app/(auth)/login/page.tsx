import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  invite_required: "This portal is invite-only. Contact an admin for an invite.",
  auth_callback_error: "Something went wrong signing you in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const googleEnabled = await isIntegrationEnabled("google_login");
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] || ERROR_MESSAGES.auth_callback_error : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-primary text-white">
            <Building2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access the SRP Portal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <LoginForm googleEnabled={googleEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
