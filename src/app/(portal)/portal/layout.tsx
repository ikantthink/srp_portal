import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandProvider } from "@/components/shared/brand-provider";
import { PortalShell } from "@/components/shared/portal-shell";
import type { Role } from "@/types/database";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, sidebar_collapsed")
    .eq("user_id", user.id)
    .single();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (roleData?.role as Role) || "user";
  const userName = profile?.full_name || user.email || "User";

  // First-load backfill: persist `false` so the key is no longer null. We
  // intentionally await so an immediate page revisit sees a populated value,
  // but it only fires once per user.
  if (profile && profile.sidebar_collapsed === null) {
    await supabase
      .from("profiles")
      .update({ sidebar_collapsed: false })
      .eq("user_id", user.id);
  }

  const initialCollapsed = profile?.sidebar_collapsed ?? false;

  return (
    <BrandProvider>
      <PortalShell
        role={role}
        userName={userName}
        userId={user.id}
        initialCollapsed={initialCollapsed}
      >
        {children}
      </PortalShell>
    </BrandProvider>
  );
}
