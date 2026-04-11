"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithPassword, signInWithMagicLink, signInWithGoogle } from "@/actions/auth";
import { Building2, Mail, Lock, Loader2 } from "lucide-react";

type AuthMode = "password" | "magic_link";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handlePasswordSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await signInWithPassword(formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    }
    setLoading(false);
  }

  async function handleMagicLink(formData: FormData) {
    setLoading(true);
    setMessage(null);
    const result = await signInWithMagicLink(formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      setMessage({ type: "success", text: result.success });
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
      setLoading(false);
    }
  }

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
          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={mode === "password" ? "default" : "secondary"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("password")}
            >
              Password
            </Button>
            <Button
              variant={mode === "magic_link" ? "default" : "secondary"}
              size="sm"
              className="flex-1"
              onClick={() => setMode("magic_link")}
            >
              Magic Link
            </Button>
          </div>

          {mode === "password" ? (
            <form action={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Your password"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          ) : (
            <form action={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-ml">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-ml"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Magic Link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
