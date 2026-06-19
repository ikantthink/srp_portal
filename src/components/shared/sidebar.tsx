"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/shared/brand-provider";
import type { Role } from "@/types/database";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Globe,
  CreditCard,
  Link2,
  FileText,
  Newspaper,
  Settings,
  Shield,
  Building2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
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
  { label: "Media", href: "/portal/media", icon: ImageIcon },
  { label: "Link Card", href: "/portal/link-card", icon: CreditCard },
  { label: "URL Shortener", href: "/portal/url-shortener", icon: Link2 },
  { label: "Forms", href: "/portal/forms", icon: FileText },
  { label: "Newsletters", href: "/portal/newsletters", icon: Newspaper, roles: ["admin", "super_admin"] },
  { label: "Settings", href: "/portal/settings", icon: Settings },
  { label: "Super Admin", href: "/portal/super-admin", icon: Shield, roles: ["super_admin"] },
];

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function SidebarItem({ item, isActive, collapsed }: SidebarItemProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);

  // Hide tooltip whenever collapse state flips (e.g. user clicks collapse while
  // hovering an icon).
  useEffect(() => {
    if (!collapsed) setTip(null);
  }, [collapsed]);

  const show = () => {
    if (!collapsed) return;
    const el = linkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTip({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  };
  const hide = () => setTip(null);

  return (
    <>
      <Link
        ref={linkRef}
        href={item.href}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn(
          "relative flex items-center gap-3 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          collapsed ? "md:justify-center md:px-0 px-3" : "px-3",
          isActive
            ? "bg-sidebar-muted text-white"
            : "text-sidebar-fg/70 hover:bg-sidebar-muted/50 hover:text-white"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className={cn(collapsed ? "md:hidden" : "inline")}>
          {item.label}
        </span>
      </Link>
      {collapsed &&
        tip &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: tip.top, left: tip.left }}
            className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded bg-sidebar-bg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-fg shadow-lg ring-1 ring-sidebar-muted"
          >
            {item.label}
          </span>,
          document.body
        )}
    </>
  );
}

export function Sidebar({
  role,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const brand = useBrand();

  const logoSrc = brand.logo_dark_url || brand.logo_url;

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-20 bg-black/50 md:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar-bg text-sidebar-fg transition-[width,transform] duration-200",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ fontFamily: "var(--font-body), var(--font-sans), system-ui, sans-serif" }}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-sidebar-muted",
            collapsed ? "md:justify-center md:px-2 px-6" : "px-6"
          )}
        >
          {logoSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoSrc}
              alt="Logo"
              className={cn(
                "object-contain",
                collapsed ? "h-8 w-8 md:h-8" : "h-8 max-w-[10rem]"
              )}
            />
          ) : (
            <>
              <Building2 className="h-6 w-6 shrink-0 text-brand-accent" />
              {!collapsed && (
                <span className="text-lg font-bold md:inline">SRP Portal</span>
              )}
            </>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href);
            return (
              <SidebarItem
                key={item.href}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
              />
            );
          })}
        </nav>

        {/* Desktop collapse/expand toggle */}
        <div className="hidden border-t border-sidebar-muted p-2 md:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider text-sidebar-fg/70 transition-colors hover:bg-sidebar-muted/50 hover:text-white",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
