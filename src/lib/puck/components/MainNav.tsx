"use client";

import type { ComponentConfig } from "@puckeditor/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MAIN_NAV_DEFAULTS,
  NAV_FONT_WEIGHT as FONT_WEIGHT,
  NAV_MAX_WIDTH_PX as MAX_WIDTH_PX,
  NAV_VARIANT_DEFAULTS,
  mergeNavVariant,
  parseLinks,
  resolveLogoUrl,
  resolveNavColor,
  type LogoResolutionBrand,
  type MainNavProps,
  type NavVariant,
  type NavVariantStyle,
} from "./nav-variant";

// NOTE: do not re-export values from this module — it's a `"use client"` file,
// and value re-exports get wrapped as client references which the server
// cannot call. Server callers must import from `./nav-variant` directly.
// Type-only re-exports are safe because types are erased.
export type {
  MainNavProps,
  NavVariant,
  NavVariantScroll,
  NavVariantStyle,
  ParsedLink,
} from "./nav-variant";

// MainNav is no longer in the Puck drawer; this Config is preserved as a
// thin shim so legacy persisted pages (which may still reference `MainNav`
// in their `data.content`) don't crash when an editor accidentally loads
// them. The renderer filters MainNav/Footer out of the rendered tree, so
// this code path is effectively unreachable at runtime.
export const MainNavConfig: ComponentConfig<MainNavProps> = {
  fields: {
    logoText: { type: "text" },
    logoUrl: { type: "text" },
    links: { type: "textarea" },
    ctaText: { type: "text" },
    ctaLink: { type: "text" },
    sticky: {
      type: "radio",
      options: [
        { label: "Sticky", value: "yes" },
        { label: "Not sticky", value: "no" },
      ],
    },
  },
  defaultProps: MAIN_NAV_DEFAULTS,
  render: (props) => (
    <MainNavView variant={mergeNavVariant({ ...NAV_VARIANT_DEFAULTS, ...props })} />
  ),
};

interface MainNavViewProps {
  variant: NavVariant;
  /**
   * Brand logo URLs from `brand_settings`. The variant can reference these
   * via the `theme:brand-logo` / `theme:brand-logo-dark` tokens, and the
   * solid-state logo falls back to `brand.logoUrl` when the variant
   * doesn't set its own `logoUrl`. Pass `null` to disable brand resolution
   * (just renders `logoText`).
   */
  brandLogos?: LogoResolutionBrand | null;
}

export function MainNavView({ variant, brandLogos = null }: MainNavViewProps) {
  const { style, scroll } = variant;
  const parsedLinks = parseLinks(variant.links);
  // Logo resolution chain:
  //   solid       = variant.logoUrl resolved → brand light → brand dark
  //   transparent = scroll.transparentLogoUrl resolved → solid logo
  // The transparent override only takes effect while the header is in its
  // transparent state (i.e. !scrolled); once it goes solid, the solid logo
  // is used. We prefer the regular brand logo over the dark variant for the
  // auto-fallback because dark logos are designed for dark backgrounds — a
  // user with only a dark logo configured still gets *something* rendered.
  const solidLogoUrl =
    resolveLogoUrl(variant.logoUrl, brandLogos) ||
    brandLogos?.logoUrl ||
    brandLogos?.logoDarkUrl ||
    "";
  const transparentLogoUrl = scroll.transparentLogoUrl
    ? resolveLogoUrl(scroll.transparentLogoUrl, brandLogos) || solidLogoUrl
    : solidLogoUrl;

  const [open, setOpen] = useState(false);
  // Transparent modes need to be sticky for the effect to make sense; we
  // ignore the per-variant `sticky` toggle in those cases.
  const isTransparentMode = scroll.mode !== "always_solid";
  const stickyOn = isTransparentMode || variant.sticky === "yes";

  // SSR/initial paint matches user intent: solid mode is solid from the
  // first byte; transparent modes paint transparent so anchors-into-a-hero
  // don't flash white before hydration.
  const [scrolled, setScrolled] = useState(scroll.mode === "always_solid");

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  useEffect(() => {
    // always_solid uses the SSR-correct default and needs no listener.
    if (scroll.mode === "always_solid") return;

    let heroHeight = 0;

    function measureHero() {
      const el = document.querySelector("main > *");
      heroHeight = el ? el.getBoundingClientRect().height : 0;
    }

    function onScroll() {
      if (scroll.mode === "transparent_until_scroll") {
        setScrolled(window.scrollY > scroll.threshold);
      } else if (heroHeight <= 0) {
        // transparent_over_hero with no measurable hero — fall back to the
        // threshold path so the variant still flips.
        setScrolled(window.scrollY > scroll.threshold);
      } else {
        setScrolled(window.scrollY > heroHeight - style.height);
      }
    }

    if (scroll.mode === "transparent_over_hero") measureHero();
    // Run an initial scroll-aware update *after* mount (e.g. when the page
    // loaded at a non-zero scroll position via anchor link or refresh). rAF
    // schedules the setState into a callback, sidestepping the
    // react-hooks/set-state-in-effect lint rule that bans synchronous body
    // state writes.
    const rafId = window.requestAnimationFrame(onScroll);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureHero);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureHero);
    };
  }, [scroll.mode, scroll.threshold, style.height]);

  // Transparent modes must overlay the hero (which lives in <main>) to show
  // through, so we take the header out of normal flow with `fixed`. Solid
  // mode keeps the sibling-in-flow `sticky` behavior so it doesn't sit on
  // top of regular page content.
  const stickyClass = isTransparentMode
    ? "fixed top-0 left-0 right-0 z-40"
    : stickyOn
      ? "sticky top-0 z-40"
      : "";

  const activeBackground = scrolled ? resolveNavColor(scroll.solidBackgroundColor) : "transparent";
  const activeTextColor = resolveNavColor(scrolled ? style.textColor : scroll.transparentTextColor);
  const activeLinkColor = resolveNavColor(scrolled ? style.linkColor : scroll.transparentTextColor);
  const activeLogoColor = resolveNavColor(scrolled ? style.textColor : scroll.transparentLogoColor);
  const activeLinkHoverColor = resolveNavColor(style.linkHoverColor);
  const activeCtaBackground = resolveNavColor(style.ctaBackgroundColor);
  const activeCtaText = resolveNavColor(style.ctaTextColor);
  const effectiveLogoUrl = scrolled ? solidLogoUrl : transparentLogoUrl;

  const transition = `background-color ${scroll.transitionMs}ms ease, color ${scroll.transitionMs}ms ease, border-color ${scroll.transitionMs}ms ease`;

  const headerStyle: React.CSSProperties = {
    backgroundColor: activeBackground,
    color: activeTextColor,
    fontFamily: style.fontFamily || undefined,
    fontSize: `${style.fontSize}px`,
    fontWeight: FONT_WEIGHT[style.fontWeight],
    transition,
    // Subtle bottom border only when solid; keeps transparent overlays clean.
    borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
  };

  const containerStyle: React.CSSProperties = {
    height: `${style.height}px`,
    maxWidth: MAX_WIDTH_PX[style.maxWidth],
  };

  const navStyle: React.CSSProperties = { gap: `${style.linkGap}px` };

  return (
    <header
      className={`${stickyClass} w-full`}
      style={headerStyle}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div
        className="mx-auto flex items-center justify-between px-4 sm:px-6"
        style={containerStyle}
      >
        <Link href="/" className="flex items-center gap-2" style={{ color: activeLogoColor }}>
          {effectiveLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logoUrl is editor-supplied and may be external; next/image would require remotePatterns config per host.
            <img src={effectiveLogoUrl} alt={variant.logoText} className="h-8 w-auto" />
          ) : (
            <span className="text-lg font-bold uppercase tracking-wide">{variant.logoText}</span>
          )}
        </Link>

        <nav className="hidden items-center md:flex" style={navStyle}>
          {parsedLinks.map((l) => (
            <NavLink
              key={l.href + l.label}
              href={l.href}
              label={l.label}
              color={activeLinkColor}
              hoverColor={activeLinkHoverColor}
              transition={transition}
            />
          ))}
          {variant.ctaText && (
            <a
              href={variant.ctaLink}
              className="inline-flex h-10 items-center rounded-lg px-4 font-semibold"
              style={{
                backgroundColor: activeCtaBackground,
                color: activeCtaText,
                fontWeight: FONT_WEIGHT.semibold,
                transition,
              }}
            >
              {variant.ctaText}
            </a>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="main-nav-mobile"
          onClick={() => setOpen(true)}
          style={{ borderColor: "currentColor", color: activeTextColor }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile menu is always solid — transparent overlays make tap targets
          unreadable. Pulls colors from style.* not scroll.transparent*. */}
      <div
        className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"} md:hidden`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          id="main-nav-mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className={`absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
          style={{ backgroundColor: resolveNavColor(style.backgroundColor), color: resolveNavColor(style.textColor) }}
        >
          <div
            className="flex items-center justify-between px-4"
            style={{ height: `${style.height}px`, borderBottom: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* Drawer is always solid, so we use the solid-state logo even
                when the desktop nav is currently in its transparent state. */}
            {solidLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- editor-supplied URL
              <img src={solidLogoUrl} alt={variant.logoText} className="h-8 w-auto" />
            ) : (
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: resolveNavColor(style.textColor) }}>
                {variant.logoText}
              </span>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-black/5"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              style={{ color: resolveNavColor(style.textColor) }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {parsedLinks.map((l) => (
              <a
                key={l.href + l.label}
                href={l.href}
                className="rounded-md px-3 py-2 text-base font-medium hover:bg-black/5"
                onClick={() => setOpen(false)}
                style={{ color: resolveNavColor(style.linkColor) }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          {variant.ctaText && (
            <div className="p-4" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <a
                href={variant.ctaLink}
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg px-4 font-semibold"
                style={{
                  backgroundColor: activeCtaBackground,
                  color: activeCtaText,
                  fontWeight: FONT_WEIGHT.semibold,
                }}
              >
                {variant.ctaText}
              </a>
            </div>
          )}
        </aside>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  color: string;
  hoverColor: string;
  transition: string;
}

function NavLink({ href, label, color, hoverColor, transition }: NavLinkProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{ color: hovered ? hoverColor : color, transition }}
    >
      {label}
    </a>
  );
}
