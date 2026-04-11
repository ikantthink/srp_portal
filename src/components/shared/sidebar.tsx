"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Globe,
  CreditCard,
  FileText,
  Newspaper,
  Settings,
  Shield,
  Building2,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Transactions", href: "/portal/transactions", icon: ArrowLeftRight },
  { label: "Leads", href: "/portal/leads", icon: Users },
  { label: "Website", href: "/portal/website", icon: Globe, roles: ["admin", "super_admin"] },
  { label: "Link Card", href: "/portal/link-card", icon: CreditCard },
  { label: "Forms", href: "/portal/forms", icon: FileText },
  { label: "Newsletters", href: "/portal/newsletters", icon: Newspaper, roles: ["admin", "super_admin"] },
  { label: "Settings", href: "/portal/settings", icon: Settings },
  { label: "Super Admin", href: "/portal/super-admin", icon: Shield, roles: ["super_admin"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar-bg text-sidebar-fg">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-muted px-6">
        <Building2 className="h-6 w-6 text-brand-accent" />
        <span className="text-lg font-bold">SRP Portal</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-muted text-white"
                  : "text-sidebar-fg/70 hover:bg-sidebar-muted/50 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
