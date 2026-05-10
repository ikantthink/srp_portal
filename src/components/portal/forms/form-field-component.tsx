"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormFieldComponentProps {
  field: FormField;
  disabled?: boolean;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function PhoneInput({
  id,
  name,
  placeholder,
  required,
  disabled,
}: {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [display, setDisplay] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setDisplay(formatted);
  }

  return (
    <Input
      id={id}
      name={name}
      type="tel"
      value={display}
      onChange={handleChange}
      placeholder={placeholder || "(555) 123-4567"}
      required={required}
      disabled={disabled}
      maxLength={14}
    />
  );
}

export function FormFieldComponent({ field, disabled }: FormFieldComponentProps) {
  if (field.type === "heading") {
    return <h2 className="text-xl font-semibold pt-4">{field.label}</h2>;
  }
  if (field.type === "paragraph") {
    return <p className="text-muted-foreground">{field.label}</p>;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={disabled ? undefined : field.id}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={field.id}
          name={field.id}
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
        />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          name={field.id}
          required={field.required}
          disabled={disabled}
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === "radio" ? (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.id} value={opt} required={field.required} disabled={disabled} />
              {opt}
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={field.id} disabled={disabled} />
          {field.placeholder || field.label}
        </label>
      ) : field.type === "phone" ? (
        <PhoneInput
          id={field.id}
          name={field.id}
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
        />
      ) : (
        <Input
          id={field.id}
          name={field.id}
          type={
            field.type === "email"
              ? "email"
              : field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : "text"
          }
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
        />
      )}
    </div>
  );
}
