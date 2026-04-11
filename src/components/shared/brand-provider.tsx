"use client";

import { useBrandTheme } from "@/hooks/use-brand-theme";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  useBrandTheme();
  return <>{children}</>;
}
