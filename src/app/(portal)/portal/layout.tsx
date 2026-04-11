import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { BrandProvider } from "@/components/shared/brand-provider";
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
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (roleData?.role as Role) || "user";
  const userName = profile?.full_name || user.email || "User";

  return (
    <BrandProvider>
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <div className="flex-1 pl-64">
          <Topbar userName={userName} userRole={role} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </BrandProvider>
  );
}
