/** Clamp vertical background focal point to 0–100%. Default 50 = center. */
export function clampPositionY(v: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function toBackgroundPosition(y: number): string {
  return `center ${clampPositionY(y)}%`;
}

export function heroFlexStillBackground(props: {
  backgroundType?: "image" | "video";
  backgroundImage?: string;
  posterUrl?: string;
}): string {
  return props.backgroundType === "video"
    ? (props.posterUrl ?? "").trim()
    : (props.backgroundImage ?? "").trim();
}
