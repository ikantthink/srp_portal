/**
 * Curated font stacks usable from any block UI.
 *
 * Only system / web-safe families are listed so we can render them without
 * shipping a webfont loader. If someone later wires up Google Fonts, add the
 * new families here (with a `load` flag and matching <link>) and every
 * existing block picks them up automatically.
 *
 * `value` is what we write to `font-family` / store on the block prop;
 * `label` is what the editor sees in the dropdown.
 */

export interface FontOption {
  label: string;
  value: string;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  { label: "Site default", value: "" },
  {
    label: "System sans-serif",
    value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Tahoma, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Times New Roman (serif)", value: "'Times New Roman', Times, serif" },
  { label: "Palatino (serif)", value: "'Palatino Linotype', Palatino, serif" },
  { label: "Garamond (serif)", value: "Garamond, Georgia, serif" },
  { label: "Courier New (mono)", value: "'Courier New', Courier, monospace" },
  { label: "Impact (display)", value: "Impact, 'Arial Black', sans-serif" },
] as const;

export const FONT_SIZE_OPTIONS: readonly FontOption[] = [
  { label: "Default", value: "" },
  { label: "12 px", value: "12px" },
  { label: "14 px", value: "14px" },
  { label: "16 px", value: "16px" },
  { label: "18 px", value: "18px" },
  { label: "20 px", value: "20px" },
  { label: "24 px", value: "24px" },
  { label: "28 px", value: "28px" },
  { label: "32 px", value: "32px" },
  { label: "36 px", value: "36px" },
  { label: "48 px", value: "48px" },
  { label: "64 px", value: "64px" },
  { label: "80 px", value: "80px" },
] as const;
