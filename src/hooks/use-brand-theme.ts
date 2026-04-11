"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BrandSettings } from "@/types/database";

const defaultBrand: Partial<BrandSettings> = {
  primary_color: "#1e40af",
  secondary_color: "#7c3aed",
  accent_color: "#f59e0b",
  font_heading: "Geist",
  font_body: "Geist",
};

export function useBrandTheme() {
  const [brand, setBrand] = useState<Partial<BrandSettings>>(defaultBrand);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("brand_settings")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        setBrand(data);
        applyTheme(data);
      }
    }

    load();
  }, []);

  return brand;
}

function applyTheme(brand: Partial<BrandSettings>) {
  const root = document.documentElement;
  if (brand.primary_color) root.style.setProperty("--brand-primary", brand.primary_color);
  if (brand.secondary_color) root.style.setProperty("--brand-secondary", brand.secondary_color);
  if (brand.accent_color) root.style.setProperty("--brand-accent", brand.accent_color);
}
