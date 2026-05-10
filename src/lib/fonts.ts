export interface GoogleFont {
  name: string;
  category: "sans-serif" | "serif";
}

export const GOOGLE_FONTS: GoogleFont[] = [
  { name: "Inter", category: "sans-serif" },
  { name: "Open Sans", category: "sans-serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "Roboto", category: "sans-serif" },
  { name: "Nunito Sans", category: "sans-serif" },
  { name: "Montserrat", category: "sans-serif" },
  { name: "Raleway", category: "sans-serif" },
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
];

/**
 * Builds a Google Fonts CSS stylesheet URL for the given font families.
 * Requests weights 400, 500, 600, and 700 for each family.
 */
export function googleFontUrl(families: string[]): string {
  const unique = [...new Set(families.filter(Boolean))];
  if (unique.length === 0) return "";

  const params = unique
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");

  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
