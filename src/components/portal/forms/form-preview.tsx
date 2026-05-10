import { Button } from "@/components/ui/button";
import { FormFieldComponent, type FormField } from "./form-field-component";

interface FormPreviewProps {
  fields: FormField[];
}

export function FormPreview({ fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Your form preview will appear here
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FormFieldComponent key={field.id} field={field} disabled />
      ))}
      <Button className="w-full" disabled>
        Submit
      </Button>
    </div>
  );
}
