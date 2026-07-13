import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/require-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserRoleManager } from "@/components/portal/settings/user-role-manager";
import { InviteUserForm } from "@/components/portal/settings/invite-user-form";
import { PendingInvitesList } from "@/components/portal/settings/pending-invites-list";
import { DeactivateUserButton } from "@/components/portal/settings/deactivate-user-button";
import type { Invite } from "@/types/database";

export default async function UsersPage() {
  const auth = await requireRole("admin", "super_admin");
  if ("error" in auth) redirect("/portal");

  const supabase = await createClient();

  const [{ data: profiles }, { data: roles }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase
      .from("invites")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  // profiles and user_roles both reference auth.users independently (no direct FK
  // between them), so PostgREST can't embed one under the other — merge in JS instead.
  const roleByUserId = new Map((roles || []).map((r) => [r.user_id, r.role]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-muted-foreground">Invite team members and manage access levels</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a Team Member</CardTitle>
          <CardDescription>They&apos;ll get an email with a link to set up their account.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm currentRole={auth.role} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
        </CardHeader>
        <CardContent>
          <PendingInvitesList invites={(invites as Invite[]) || []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles?.map((profile) => {
              const role = roleByUserId.get(profile.user_id) || "user";
              return (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {auth.role === "super_admin" ? (
                      <>
                        <UserRoleManager userId={profile.user_id} currentRole={role} />
                        <DeactivateUserButton userId={profile.user_id} email={profile.email} />
                      </>
                    ) : (
                      <span className="text-sm font-medium capitalize text-muted-foreground">
                        {role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
