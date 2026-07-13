/**
 * Seed a pending invite directly (bypasses RLS via the service role key).
 *
 * The portal is invite-only: no account can be created without a matching
 * pending invite row, so the very first super_admin has to be seeded this
 * way before anyone can sign up through /accept-invite.
 *
 * Usage:
 *   npx tsx scripts/create-invite.ts jake@tekforge.io super_admin
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * in .env.local (loaded automatically).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { randomBytes } from "crypto";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const email = process.argv[2];
const role = process.argv[3] || "user";

if (!email) {
  console.error("Usage: npx tsx scripts/create-invite.ts <email> [role]");
  process.exit(1);
}

if (!["user", "admin", "super_admin"].includes(role)) {
  console.error(`Invalid role: ${role}. Must be user, admin, or super_admin.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const token = randomBytes(32).toString("base64url");

  const { error } = await supabase.from("invites").insert({
    email: email.toLowerCase(),
    role,
    token,
    status: "pending",
  });

  if (error) {
    console.error("Failed to create invite:", error.message);
    process.exit(1);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  console.log(`✓ Invite created for ${email} (${role})`);
  console.log(`  ${siteUrl}/accept-invite?token=${token}`);
}

main();
