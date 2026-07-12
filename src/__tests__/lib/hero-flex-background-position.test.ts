import { describe, it, expect } from "vitest";
import {
  clampPositionY,
  heroFlexStillBackground,
  toBackgroundPosition,
} from "@/lib/puck/components/hero-flex-background-position";

describe("hero-flex-background-position", () => {
  it("heroFlexStillBackground picks image or poster by mode", () => {
    expect(
      heroFlexStillBackground({
        backgroundType: "image",
        backgroundImage: "https://example.com/a.jpg",
      }),
    ).toBe("https://example.com/a.jpg");
    expect(
      heroFlexStillBackground({
        backgroundType: "video",
        posterUrl: "https://example.com/poster.jpg",
      }),
    ).toBe("https://example.com/poster.jpg");
  });

  it("clampPositionY clamps and defaults invalid to 50", () => {
    expect(clampPositionY(50)).toBe(50);
    expect(clampPositionY(0)).toBe(0);
    expect(clampPositionY(100)).toBe(100);
    expect(clampPositionY(-10)).toBe(0);
    expect(clampPositionY(150)).toBe(100);
    expect(clampPositionY(42.7)).toBe(43);
    expect(clampPositionY(Number.NaN)).toBe(50);
  });

  it("toBackgroundPosition returns center N%", () => {
    expect(toBackgroundPosition(50)).toBe("center 50%");
    expect(toBackgroundPosition(0)).toBe("center 0%");
    expect(toBackgroundPosition(100)).toBe("center 100%");
    expect(toBackgroundPosition(Number.NaN)).toBe("center 50%");
  });
});
