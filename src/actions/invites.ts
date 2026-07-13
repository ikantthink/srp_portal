"use server";

import { randomBytes } from "crypto";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/supabase/require-auth";
import { sendEmail } from "@/lib/email/resend";
import InviteUser from "@/../emails/InviteUser";
import type { Role } from "@/types/database";

const USERS_PATH = "/portal/users";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

async function sendInviteEmail(email: string, role: Role, inviterName: string, token: string) {
  const acceptUrl = `${siteUrl()}/accept-invite?token=${token}`;
  const html = await render(InviteUser({ inviterName, role, acceptUrl }));
  await sendEmail({
    to: email,
    subject: "You're invited to the SRP Portal",
    html,
  });
}

export async function createInvite(formData: FormData) {
  const auth = await requireRole("admin", "super_admin");
  if ("error" in auth) return { error: auth.error };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as Role;

  if (!email) return { error: "Email is required" };
  if (!["user", "admin", "super_admin"].includes(role)) {
    return { error: "Invalid role" };
  }
  if (role === "super_admin" && auth.role !== "super_admin") {
    return { error: "Only a super admin can invite another super admin" };
  }

  const supabase = await createClient();

  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id")
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle();
  if (existingInvite) {
    return { error: "There is already a pending invite for this email" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();
  if (profile) {
    return { error: "This email already has an account" };
  }

  const token = generateToken();

  const { error } = await supabase.from("invites").insert({
    email,
    role,
    invited_by: auth.userId,
    token,
  });
  if (error) return { error: error.message };

  const {
    data: { user: inviter },
  } = await supabase.auth.getUser();

  try {
    await sendInviteEmail(email, role, inviter?.email || "A team member", token);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send invite email" };
  }

  revalidatePath(USERS_PATH);
  return { success: `Invite sent to ${email}` };
}

export async function resendInvite(inviteId: string) {
  const auth = await requireRole("admin", "super_admin");
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .eq("status", "pending")
    .single();
  if (!invite) return { error: "Invite not found" };

  const { error } = await supabase
    .from("invites")
    .update({ expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString() })
    .eq("id", inviteId);
  if (error) return { error: error.message };

  const {
    data: { user: inviter },
  } = await supabase.auth.getUser();

  try {
    await sendInviteEmail(invite.email, invite.role, inviter?.email || "A team member", invite.token);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send invite email" };
  }

  revalidatePath(USERS_PATH);
  return { success: `Invite resent to ${invite.email}` };
}

export async function revokeInvite(inviteId: string) {
  const auth = await requireRole("admin", "super_admin");
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);
  if (error) return { error: error.message };

  revalidatePath(USERS_PATH);
  return { success: "Invite revoked" };
}

export async function deactivateUser(userId: string) {
  const auth = await requireRole("super_admin");
  if ("error" in auth) return { error: auth.error };
  if (userId === auth.userId) return { error: "You can't deactivate your own account" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath(USERS_PATH);
  return { success: "User deactivated" };
}

export type AcceptInviteResult = { error: string } | { success: true };

export async function acceptInvite(token: string, password: string): Promise<AcceptInviteResult> {
  if (!token) return { error: "Missing invite token" };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invite) return { error: "This invite link is invalid or has already been used." };
  if (new Date(invite.expires_at) < new Date()) {
    return { error: "This invite has expired. Ask an admin to resend it." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: createError?.message || "Failed to create account" };
  }

  await admin.from("user_roles").update({ role: invite.role }).eq("user_id", created.user.id);
  await admin
    .from("invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password,
  });
  if (signInError) return { error: signInError.message };

  return { success: true };
}

export async function lookupInvite(token: string) {
  if (!token) return null;
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("email, role, status, expires_at")
    .eq("token", token)
    .single();
  return invite;
}
