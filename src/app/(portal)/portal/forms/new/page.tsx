import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormCreateDialog } from "@/components/portal/forms/form-create-dialog";

export default function NewFormPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Form</h1>
      <Card>
        <CardHeader>
          <CardTitle>New Form</CardTitle>
        </CardHeader>
        <CardContent>
          <FormCreateDialog />
        </CardContent>
      </Card>
    </div>
  );
}
