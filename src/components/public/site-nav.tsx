import { getBrandLogos, getNavVariant } from "@/lib/site-chrome";
import { MainNavView } from "@/lib/puck/components/MainNav";
import type { NavVariant } from "@/lib/puck/components/nav-variant";

interface SiteNavProps {
  variant?: NavVariant;
}

/**
 * Server wrapper that renders the public-site header. The variant is
 * resolved per-request in `(public)/layout.tsx`; when omitted (e.g. legacy
 * callers) the default variant is loaded as a safe fallback. Brand logo
 * URLs are loaded here too so MainNavView can resolve the variant's
 * `theme:brand-logo` / `theme:brand-logo-dark` tokens.
 */
export async function SiteNav({ variant }: SiteNavProps = {}) {
  const [resolved, brandLogos] = await Promise.all([
    variant ? Promise.resolve(variant) : getNavVariant(null),
    getBrandLogos(),
  ]);
  return <MainNavView variant={resolved} brandLogos={brandLogos} />;
}
