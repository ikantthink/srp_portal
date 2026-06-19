import { listBlockPresets } from "@/actions/block-presets";
import { BlockPresetsManager } from "@/components/portal/settings/block-presets-manager";
import { puckConfig, componentNames } from "@/lib/puck/config";
import type { ComponentConfig } from "@puckeditor/core";

export default async function WebsiteBlockPresetsPage() {
  const presets = await listBlockPresets();

  const defaultBlocks = componentNames.map((type) => {
    const cfg = puckConfig.components[type] as ComponentConfig | undefined;
    return {
      type,
      label: (cfg as { label?: string } | undefined)?.label || type,
      defaultProps: (cfg?.defaultProps as Record<string, unknown>) ?? {},
    };
  });

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-xl font-semibold">Block Presets</h2>
        <p className="text-sm text-muted-foreground">
          The default page-builder blocks plus reusable presets you save from
          configured components.
        </p>
      </div>
      <BlockPresetsManager
        initialPresets={presets}
        componentTypes={componentNames}
        defaultBlocks={defaultBlocks}
      />
    </div>
  );
}
