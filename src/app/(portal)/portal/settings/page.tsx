import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Mail, User } from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "Profile",
      description: "Update your name, bio, and avatar",
      href: "/portal/settings/profile",
      icon: User,
    },
    {
      title: "Notifications",
      description: "Email and SMS notification preferences",
      href: "/portal/settings/notifications",
      icon: Bell,
    },
    {
      title: "Email Templates",
      description: "Customize email and SMS templates",
      href: "/portal/settings/templates",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="transition-colors hover:border-brand-primary/50 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-primary/10 p-2">
                    <s.icon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
