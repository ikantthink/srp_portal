"use client";

import { Render, type Config, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./config";
import { useMemo } from "react";

interface PuckRendererProps {
  data: Data;
}

export function PuckRenderer({ data }: PuckRendererProps) {
  const config = useMemo(() => buildRendererConfig(data), [data]);
  return <Render config={config} data={data} />;
}

function buildRendererConfig(data: Data): Config {
  const usedTypes = new Set<string>();
  for (const item of data.content || []) {
    usedTypes.add((item as any).type);
  }

  const unknownTypes = [...usedTypes].filter((t) => !puckConfig.components[t]);
  if (unknownTypes.length === 0) return puckConfig;

  const extraComponents: Record<string, any> = {};
  for (const type of unknownTypes) {
    const baseType = type.split("__")[0];
    if (puckConfig.components[baseType]) {
      extraComponents[type] = puckConfig.components[baseType];
    }
  }

  return {
    ...puckConfig,
    components: { ...puckConfig.components, ...extraComponents },
  } as Config;
}
