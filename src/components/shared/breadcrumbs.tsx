"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  portal: "Dashboard",
  "super-admin": "Super Admin",
  "api-keys": "API Keys",
  branding: "Branding",
  domains: "Domains",
  integrations: "Integrations",
  listings: "Listings Provider",
  users: "Users & Roles",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
  templates: "Templates",
  "block-presets": "Block Presets",
  transactions: "Transactions",
  leads: "Leads",
  website: "Website",
  media: "Media",
  pages: "Pages",
  "link-card": "Link Card",
  "url-shortener": "URL Shortener",
  forms: "Forms",
  newsletters: "Newsletters",
  subscribers: "Subscribers",
  new: "New",
};

function toLabel(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  return segment
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function Breadcrumbs() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  // Hide on top-level dashboard. There's nothing meaningful above it.
  if (segments.length <= 1) return null;

  // Drop the implicit "portal" prefix; it's the dashboard root we link via the
  // home icon.
  const rawTrail = segments[0] === "portal" ? segments.slice(1) : segments;

  // /portal/website/pages/[id] is the page editor; the website CMS index at
  // /portal/website already lists pages, so the "Pages" crumb is noise and its
  // URL doesn't exist as a standalone route.
  const trail = rawTrail.filter(
    (seg, i) => !(seg === "pages" && rawTrail[i - 1] === "website")
  );

  const crumbs = trail.map((seg, i) => ({
    href: `/portal/${trail.slice(0, i + 1).join("/")}`,
    label: toLabel(seg),
    isLast: i === trail.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"
    >
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 hover:text-foreground"
        aria-label="Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          {c.isLast ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-foreground">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
