"use client";

import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "./config";

interface PuckRendererProps {
  data: Data;
}

export function PuckRenderer({ data }: PuckRendererProps) {
  return <Render config={puckConfig} data={data} />;
}
