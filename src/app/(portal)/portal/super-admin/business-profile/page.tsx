import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessProfileForm } from "@/components/portal/super-admin/business-profile-form";
import { getBusinessProfile } from "@/lib/seo/business-profile";

export default async function BusinessProfilePage() {
  const profile = await getBusinessProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-muted-foreground">
          Name, address, and profile links published as structured data so
          search engines and AI assistants can identify the business. Keep
          these identical to the Google Business Profile and directory listings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Public business details</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
