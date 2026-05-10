import { listBlockPresets } from "@/actions/block-presets";
import { BlockPresetsManager } from "@/components/portal/settings/block-presets-manager";
import { componentNames } from "@/lib/puck/config";

export default async function BlockPresetsPage() {
  const presets = await listBlockPresets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Block Presets</h1>
        <p className="text-muted-foreground">
          Save configured versions of page components as reusable presets.
        </p>
      </div>
      <BlockPresetsManager
        initialPresets={presets}
        componentTypes={componentNames}
      />
    </div>
  );
}
