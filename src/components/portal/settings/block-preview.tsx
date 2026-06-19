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

  // #region agent log
  fetch("http://127.0.0.1:7382/ingest/7add8312-e272-4f75-96d1-733988ab72fa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "146f8b",
    },
    body: JSON.stringify({
      sessionId: "146f8b",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "block-preview.tsx:previewData",
      message: "slot prop types in preview data",
      data: {
        baseType,
        columnsIsArray: Array.isArray(mergedProps.columns),
        contentIsArray: Array.isArray(mergedProps.content),
        renderPath: "Render",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
