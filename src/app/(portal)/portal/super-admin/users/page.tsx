import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRoleManager } from "@/components/portal/settings/user-role-manager";

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, user_roles(role)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-muted-foreground">Manage team members and their access levels</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles?.map((profile) => {
              const role = (profile as any).user_roles?.[0]?.role || "user";
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <UserRoleManager userId={profile.user_id} currentRole={role} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
