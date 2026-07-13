"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Drop-in replacement for `<Button type="submit">` inside a `<form action={fn}>`.
 * Disables itself synchronously via useFormStatus while the action is pending,
 * closing the double-click race that a useState-based loading flag can't. */
export function SubmitButton({ disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled} {...props} />;
}
