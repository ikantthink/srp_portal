import { getSiteFooter } from "@/lib/site-chrome";
import { FooterView } from "@/lib/puck/components/Footer";

interface SiteFooterProps {
  /** CSS `max-width` for the footer's inner content container. Pass the
   * value derived from the active nav variant so the footer aligns with the
   * navbar above it. Omit to fall back to FooterView's built-in default. */
  containerMaxWidth?: string;
}

/**
 * Server wrapper that loads the global footer config and renders the same
 * view component that the (now-removed) Puck Footer block used.
 */
export async function SiteFooter({ containerMaxWidth }: SiteFooterProps = {}) {
  const footer = await getSiteFooter();
  return <FooterView {...footer} containerMaxWidth={containerMaxWidth} />;
}
