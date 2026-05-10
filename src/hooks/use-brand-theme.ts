"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { googleFontUrl } from "@/lib/fonts";
import { deriveSidebarColors } from "@/lib/color-utils";
import type { BrandSettings } from "@/types/database";

const defaultBrand: Partial<BrandSettings> = {
  primary_color: "#1e40af",
  secondary_color: "#7c3aed",
  accent_color: "#f59e0b",
  font_heading: "Inter",
  font_body: "Inter",
};

const FONT_LINK_ID = "brand-google-fonts";

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

export function applyTheme(brand: Partial<BrandSettings>) {
  const root = document.documentElement;
  if (brand.primary_color) root.style.setProperty("--brand-primary", brand.primary_color);
  if (brand.secondary_color) root.style.setProperty("--brand-secondary", brand.secondary_color);
  if (brand.accent_color) root.style.setProperty("--brand-accent", brand.accent_color);

  if (brand.font_heading) root.style.setProperty("--font-heading", `"${brand.font_heading}"`);
  if (brand.font_body) root.style.setProperty("--font-body", `"${brand.font_body}"`);

  const derived = deriveSidebarColors(brand.primary_color ?? "#1e40af");
  root.style.setProperty("--sidebar-bg", brand.sidebar_bg ?? derived.bg);
  root.style.setProperty("--sidebar-fg", brand.sidebar_fg ?? derived.fg);
  root.style.setProperty("--sidebar-muted", brand.sidebar_muted ?? derived.muted);

  const families = [brand.font_heading, brand.font_body].filter(
    (f): f is string => Boolean(f) && f !== "Geist"
  );

  if (families.length > 0) {
    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = googleFontUrl(families);
  }
}
