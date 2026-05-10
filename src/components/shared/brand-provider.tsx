"use client";

import { createContext, useContext } from "react";
import { useBrandTheme } from "@/hooks/use-brand-theme";
import type { BrandSettings } from "@/types/database";

const BrandContext = createContext<Partial<BrandSettings>>({});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const brand = useBrandTheme();
  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
