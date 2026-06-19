import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Globe, Mail, Palette, User, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";

interface Section {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

const sections: Section[] = [
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
  {
    title: "Branding",
    description: "Logos, colors, fonts, and sidebar theme",
    href: "/portal/settings/branding",
    icon: Palette,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Website",
    description: "Block presets and reusable defaults",
    href: "/portal/settings/website",
    icon: Globe,
    roles: ["admin", "super_admin"],
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role = "user";
  if (user) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    role = (roleRow?.role as Role) || "user";
  }

  const visible = sections.filter((s) => !s.roles || s.roles.includes(role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => (
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
