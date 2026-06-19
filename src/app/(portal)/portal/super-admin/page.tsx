import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Globe,
  PlugZap,
  Building,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Section {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface Group {
  title: string;
  description: string;
  sections: Section[];
}

const groups: Group[] = [
  {
    title: "Domains",
    description: "Where the portal and public site live.",
    sections: [
      {
        title: "Domains",
        description: "Primary site domain and short URL domain",
        href: "/portal/super-admin/domains",
        icon: Globe,
      },
    ],
  },
  {
    title: "Integrations",
    description:
      "Optional services that can be turned on or off per deployment.",
    sections: [
      {
        title: "Integrations",
        description:
          "Toggle Google login, Twilio, Resend, AI, listings provider",
        href: "/portal/super-admin/integrations",
        icon: PlugZap,
      },
      {
        title: "Listings Provider",
        description: "IDX Broker and RESO Web API credentials",
        href: "/portal/super-admin/listings",
        icon: Building,
      },
    ],
  },
  {
    title: "Access",
    description: "Who can sign in and what they can do.",
    sections: [
      {
        title: "Users & Roles",
        description: "Manage team members and assign roles",
        href: "/portal/super-admin/users",
        icon: Users,
      },
    ],
  },
];

export default function SuperAdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
        <p className="text-muted-foreground">
          System configuration and management
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <p className="text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.sections.map((s) => (
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
        </section>
      ))}
    </div>
  );
}
