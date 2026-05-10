/**
 * Promote a user to super_admin role.
 *
 * Usage:
 *   npx tsx scripts/promote-super-admin.ts jake@tekforge.io
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * in .env.local (loaded automatically).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

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
if (!email) {
  console.error("Usage: npx tsx scripts/promote-super-admin.ts <email>");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: users, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const user = users.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error(
      "Make sure the user has signed up first (via /login or the Supabase Dashboard)."
    );
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from("user_roles")
    .update({ role: "super_admin" })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Failed to update role:", updateError.message);
    process.exit(1);
  }

  console.log(`✓ ${email} promoted to super_admin`);
}

main();
