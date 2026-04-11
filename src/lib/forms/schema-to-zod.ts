import { z } from "zod";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export function schemaToZod(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.type === "heading" || field.type === "paragraph") continue;

    let validator: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        validator = z.string().email("Invalid email address");
        break;
      case "number":
        validator = z.coerce.number();
        break;
      case "date":
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
        break;
      case "checkbox":
        validator = z.boolean();
        break;
      case "multi_select":
        validator = z.array(z.string());
        break;
      case "phone":
        validator = z.string().min(7, "Invalid phone number");
        break;
      default:
        validator = z.string();
    }

    if (field.required) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, `${field.label} is required`);
      }
    } else {
      validator = validator.optional();
    }

    shape[field.id] = validator;
  }

  return z.object(shape);
}
