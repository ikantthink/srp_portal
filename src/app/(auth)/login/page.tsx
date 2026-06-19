import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const googleEnabled = await isIntegrationEnabled("google_login");

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
        <CardContent>
          <LoginForm googleEnabled={googleEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
