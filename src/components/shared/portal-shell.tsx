"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/database";

interface PortalShellProps {
  role: Role;
  userName: string;
  userId: string;
  initialCollapsed: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  role,
  userName,
  userId,
  initialCollapsed,
  children,
}: PortalShellProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const onToggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      void createClient()
        .from("profiles")
        .update({ sidebar_collapsed: next })
        .eq("user_id", userId);
      return next;
    });
  }, [userId]);

  const onCloseMobile = useCallback(() => setMobileOpen(false), []);
  const onOpenMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="flex min-h-screen overflow-x-clip">
      <Sidebar
        role={role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={onToggleCollapsed}
        onCloseMobile={onCloseMobile}
      />
      <div
        className={cn(
          "min-w-0 flex-1 transition-[padding] duration-200",
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <Topbar
          userName={userName}
          userRole={role}
          onOpenMobile={onOpenMobile}
        />
        <main className="p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
