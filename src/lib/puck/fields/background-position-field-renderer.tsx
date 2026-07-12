"use client";

import { useCallback, useRef, useState } from "react";
import { createUsePuck } from "@puckeditor/core";
import {
  clampPositionY,
  heroFlexStillBackground,
  toBackgroundPosition,
} from "../components/hero-flex-background-position";

const usePuckSelector = createUsePuck();

function selectHeroFlexImageUrl(state: {
  selectedItem: { type: string; props: unknown } | null;
}): string {
  const item = state.selectedItem;
  if (item?.type !== "HeroFlex") return "";
  return heroFlexStillBackground(
    item.props as {
      backgroundType?: "image" | "video";
      backgroundImage?: string;
      posterUrl?: string;
    },
  );
}

export function BackgroundPositionFieldRender({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) {
  const imageUrl = usePuckSelector(selectHeroFlexImageUrl);

  const stripRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const positionY = clampPositionY(value);

  const updateFromDelta = useCallback(
    (clientY: number) => {
      const drag = dragRef.current;
      const strip = stripRef.current;
      if (!drag || !strip) return;
      const height = strip.getBoundingClientRect().height;
      if (height <= 0) return;
      const deltaY = clientY - drag.startY;
      const next = clampPositionY(drag.startValue - (deltaY / height) * 100);
      onChange(next);
    },
    [onChange],
  );

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (readOnly || !imageUrl) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startValue: positionY };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    updateFromDelta(e.clientY);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDragging(false);
  }

  if (!imageUrl) {
    return (
      <p id={id} className="text-[11px] text-muted-foreground">
        Add a background image first.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div
        ref={stripRef}
        id={id}
        role="slider"
        aria-label="Image vertical position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={positionY}
        aria-valuetext={`${positionY}% from top`}
        tabIndex={readOnly ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (readOnly) return;
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChange(clampPositionY(positionY - step));
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onChange(clampPositionY(positionY + step));
          }
        }}
        className={`relative h-20 w-full overflow-hidden rounded border border-border bg-muted/30 touch-none select-none ${
          readOnly ? "opacity-50" : "cursor-ns-resize"
        } ${dragging ? "ring-1 ring-ring" : ""}`}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: toBackgroundPosition(positionY),
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/60" />
        <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {positionY}%
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">Drag up/down to reposition</p>
    </div>
  );
}
