"use client";

import { useEffect, useState } from "react";

// Tailwind's default breakpoints, used to scale a carousel's "items per view"
// down on narrow screens: xs = 1, sm = 2, md = 3, lg = 4, xl = 5, 2xl+ = 6.
const RESPONSIVE_BREAKPOINTS: Array<{ minWidth: number; cap: number }> = [
  { minWidth: 1536, cap: 6 },
  { minWidth: 1280, cap: 5 },
  { minWidth: 1024, cap: 4 },
  { minWidth: 768, cap: 3 },
  { minWidth: 640, cap: 2 },
  { minWidth: 0, cap: 1 },
];

function capForWidth(width: number): number {
  for (const bp of RESPONSIVE_BREAKPOINTS) {
    if (width >= bp.minWidth) return bp.cap;
  }
  return 1;
}

export function useResponsivePerView(maxPerView: number): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (width === null) return 1;
  return Math.max(1, Math.min(maxPerView, capForWidth(width)));
}
