import { redirect } from "next/navigation";

export default function WebsiteSettingsLandingPage() {
  redirect("/portal/settings/website/block-presets");
}
