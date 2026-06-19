import { headers } from "next/headers";
import { BrandProvider } from "@/components/shared/brand-provider";
import { SiteNav } from "@/components/public/site-nav";
import { SiteFooter } from "@/components/public/site-footer";
import { getNavVariantForPath } from "@/lib/site-chrome";
import { NAV_MAX_WIDTH_PX } from "@/lib/puck/components/nav-variant";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const variant = await getNavVariantForPath(pathname);
  // Forward the active nav variant's container width to the footer so the
  // two pieces of chrome always share the same horizontal bounds. The nav
  // applies the same value via `NAV_MAX_WIDTH_PX[style.maxWidth]`.
  const footerContainerMaxWidth = NAV_MAX_WIDTH_PX[variant.style.maxWidth];

  return (
    <BrandProvider>
      <div className="flex min-h-screen flex-col">
        <SiteNav variant={variant} />
        <main className="flex-1">{children}</main>
        <SiteFooter containerMaxWidth={footerContainerMaxWidth} />
      </div>
    </BrandProvider>
  );
}
