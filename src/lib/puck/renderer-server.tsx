import type { Data } from "@puckeditor/core";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { PuckRenderer } from "./renderer";

/**
 * Server wrapper around PuckRenderer that resolves runtime feature flags
 * (currently just listings) once per request and passes them down to the
 * client renderer.
 */
export async function PuckRendererServer({ data }: { data: Data }) {
  const listingsEnabled = await isIntegrationEnabled("listings_api");
  return <PuckRenderer data={data} listingsEnabled={listingsEnabled} />;
}
