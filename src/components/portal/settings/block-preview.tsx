"use client";

import { Render, type Data } from "@puckeditor/core";
import { puckConfig } from "@/lib/puck/config";

interface BlockPreviewProps {
  /** Component type registered in puckConfig.components (e.g. "Hero"). */
  type: string;
  /** Override props merged on top of the component's defaultProps. */
  props?: Record<string, unknown>;
  className?: string;
}

/**
 * Scaled down preview of a Puck component, rendered with the current brand
 * theme so editors can see how a block will look on the live site.
 *
 * Uses Puck's `Render` so slot fields (Row.columns, Column.content) are
 * resolved into components instead of raw arrays. Wrapped in a
 * pointer-events-disabled scaled container so users can't click into
 * placeholder forms or links.
 */
export function BlockPreview({ type, props = {}, className }: BlockPreviewProps) {
  const baseType = type.split("__")[0];
  const config = puckConfig.components[baseType] as
    | {
        render?: React.ComponentType<Record<string, unknown>>;
        defaultProps?: Record<string, unknown>;
      }
    | undefined;

  if (!config?.render) {
    return (
      <div
        className={
          "flex h-32 items-center justify-center rounded-md border bg-muted/30 text-xs text-muted-foreground " +
          (className ?? "")
        }
      >
        No preview available
      </div>
    );
  }

  const mergedProps = {
    id: `preview-${baseType}`,
    ...(config.defaultProps ?? {}),
    ...props,
  };

  const previewData: Data = {
    content: [{ type: baseType, props: mergedProps }],
    root: { props: {} },
  };

  return (
    <div
      className={
        "relative h-32 overflow-hidden rounded-md border bg-background " +
        (className ?? "")
      }
      aria-hidden
    >
      <div
        className="absolute left-0 top-0 pointer-events-none select-none"
        style={{
          width: "1280px",
          transform: "scale(0.18)",
          transformOrigin: "top left",
        }}
      >
        <Render config={puckConfig} data={previewData} />
      </div>
    </div>
  );
}
