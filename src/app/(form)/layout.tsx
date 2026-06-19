import { BrandProvider } from "@/components/shared/brand-provider";

/**
 * Layout for hosted form pages (`/f/[slug]`). Deliberately omits the public
 * SiteNav and SiteFooter — the form is a self-contained page that is
 * frequently embedded via iframe (`?embed=true`) from a Puck FormEmbed
 * block. Including the chrome here overflowed the iframe and surfaced the
 * iframe's internal scrollbar as a vertical "shadow" along its right edge.
 *
 * Authors who want a branded page wrapper for a standalone form can build
 * one in the form's own `pageData` / `successPageData` (Puck-edited
 * landing & success pages).
 */
export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <main className="min-h-screen">{children}</main>
    </BrandProvider>
  );
}
