"use client";

import { forwardRef, useState, type ChangeEvent } from "react";
import { Input } from "./input";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, "").slice(0, 10);
}

interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (digits: string) => void;
  name?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, defaultValue, onValueChange, name, ...props }, ref) => {
    const [internal, setInternal] = useState(() =>
      formatPhone(defaultValue ?? value ?? "")
    );

    const display = value !== undefined ? formatPhone(value) : internal;

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const digits = stripPhone(e.target.value);
      const formatted = formatPhone(digits);
      setInternal(formatted);
      onValueChange?.(digits);
    }

    return (
      <>
        <Input
          ref={ref}
          type="tel"
          placeholder="(555) 123-4567"
          {...props}
          value={display}
          onChange={handleChange}
        />
        {name && (
          <input type="hidden" name={name} value={stripPhone(display)} />
        )}
      </>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
