import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChromeEditor } from "@/components/portal/website/chrome-editor";
import { getBrandLogos, getSiteFooter, listNavVariants } from "@/lib/site-chrome";

export default async function WebsiteChromePage() {
  const [variants, footer, brandLogos] = await Promise.all([
    listNavVariants(),
    getSiteFooter(),
    getBrandLogos(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation &amp; Footer</h1>
          <p className="text-muted-foreground">
            Define navigation variants and the global footer used across every
            public page.
          </p>
        </div>
        <Link href="/portal/website">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Back to pages
          </Button>
        </Link>
      </div>

      <ChromeEditor
        initialVariants={variants}
        initialFooter={footer}
        brandLogos={brandLogos}
      />
    </div>
  );
}
