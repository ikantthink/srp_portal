import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, Key, Users, Globe } from "lucide-react";

export default function SuperAdminPage() {
  const sections = [
    {
      title: "Branding",
      description: "Logo, colors, and fonts for portal and website",
      href: "/portal/super-admin/branding",
      icon: Palette,
    },
    {
      title: "Domains",
      description: "Primary site domain and short URL domain",
      href: "/portal/super-admin/domains",
      icon: Globe,
    },
    {
      title: "API Keys",
      description: "Twilio, Resend, IDX Broker, RESO, OpenAI",
      href: "/portal/super-admin/api-keys",
      icon: Key,
    },
    {
      title: "Users & Roles",
      description: "Manage team members and assign roles",
      href: "/portal/super-admin/users",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
        <p className="text-muted-foreground">System configuration and management</p>
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
