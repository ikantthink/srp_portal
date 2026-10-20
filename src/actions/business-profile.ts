"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  BUSINESS_PROFILE_KEY,
  parseAgents,
  parseAreas,
  parseProfileUrls,
  type BusinessProfile,
} from "@/lib/seo/business-profile";

const inputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500),
  phone: z.string().trim().max(40),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid email",
    }),
  street: z.string().trim().max(200),
  city: z.string().trim().max(80),
  region: z.string().trim().max(40),
  postalCode: z.string().trim().max(20),
  areasServed: z.string().max(500),
  brokerage: z.string().trim().max(120),
  agents: z.string().max(2000),
  sameAs: z.string().max(4000),
});

export type BusinessProfileInput = z.infer<typeof inputSchema>;

export async function updateBusinessProfile(input: BusinessProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (roleRow?.role !== "super_admin") {
    return { error: "Only super admins can edit the business profile" };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid business profile" };
  }

  const urls = parseProfileUrls(parsed.data.sameAs);
  if ("error" in urls) return { error: urls.error };

  const profile: BusinessProfile = {
    name: parsed.data.name,
    description: parsed.data.description,
    phone: parsed.data.phone,
    email: parsed.data.email,
    street: parsed.data.street,
    city: parsed.data.city,
    region: parsed.data.region,
    postalCode: parsed.data.postalCode,
    country: "US",
    areasServed: parseAreas(parsed.data.areasServed),
    brokerage: parsed.data.brokerage,
    agents: parseAgents(parsed.data.agents),
    sameAs: urls.urls,
  };

  const { data: existing } = await supabase
    .from("website_settings")
    .select("key")
    .eq("key", BUSINESS_PROFILE_KEY)
    .maybeSingle();

  if (existing?.key) {
    const { error } = await supabase
      .from("website_settings")
      .update({ value: profile })
      .eq("key", BUSINESS_PROFILE_KEY);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("website_settings")
      .insert({ key: BUSINESS_PROFILE_KEY, value: profile });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
