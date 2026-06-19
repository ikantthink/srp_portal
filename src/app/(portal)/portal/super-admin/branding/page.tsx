import { redirect } from "next/navigation";

// Branding moved out of Super Admin in favor of a standalone tile under
// regular Settings. This redirect preserves any existing bookmarks or links.
export default function LegacySuperAdminBrandingPage() {
  redirect("/portal/settings/branding");
}
