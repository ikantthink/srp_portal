"use client";

import { Render, type Config, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./config";
import { useMemo } from "react";

interface PuckRendererProps {
  data: Data;
  /** When false, listings-backed blocks render a "not configured" placeholder. */
  listingsEnabled?: boolean;
}

const LISTINGS_COMPONENTS = ["FeaturedListings", "ListingSearch", "ListingsGrid"];

export function PuckRenderer({ data, listingsEnabled = true }: PuckRendererProps) {
  const { config, data: filteredData } = useMemo(
    () => buildRendererSetup(data, listingsEnabled),
    [data, listingsEnabled]
  );
  return <Render config={config} data={filteredData} />;
}

type Components = typeof puckConfig.components;

function buildRendererSetup(data: Data, listingsEnabled: boolean): { config: Config; data: Data } {
  const usedTypes = new Set<string>();
  for (const item of data.content || []) {
    usedTypes.add((item as { type: string }).type);
  }

  const unknownTypes = [...usedTypes].filter((t) => !puckConfig.components[t]);

  let components: Components = puckConfig.components;

  // Preset variants like `Hero__abc12345` share a render with their base type.
  // Map them in so the user-saved JSON still resolves to a real component.
  if (unknownTypes.length > 0) {
    const extra: Components = {};
    for (const type of unknownTypes) {
      const baseType = type.split("__")[0];
      if (puckConfig.components[baseType]) {
        extra[type] = puckConfig.components[baseType];
      }
    }
    components = { ...components, ...extra };
  }

  // Strip any remaining unknown types from the content tree. Puck's `Render`
  // doesn't guard against missing components, so a stale block like `MainNav`
  // (now living as global site chrome) would crash the page. Filtering keeps
  // legacy data renderable until the page is opened in the editor and saved.
  const filteredContent = (data.content || []).filter(
    (item) => !!components[(item as { type: string }).type]
  );
  const filteredData: Data = { ...data, content: filteredContent };

  if (!listingsEnabled) {
    const overridden: Components = { ...components };
    for (const name of Object.keys(overridden)) {
      const baseType = name.split("__")[0];
      if (LISTINGS_COMPONENTS.includes(baseType)) {
        overridden[name] = {
          ...overridden[name],
          render: ListingsDisabledPlaceholder,
        };
      }
    }
    components = overridden;
  }

  return { config: { ...puckConfig, components } as Config, data: filteredData };
}

function ListingsDisabledPlaceholder() {
  return (
    <section className="px-6 py-16">
      <div className="max-w-3xl mx-auto rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-center text-sm text-muted-foreground">
        Listings provider not configured.
      </div>
    </section>
  );
}
