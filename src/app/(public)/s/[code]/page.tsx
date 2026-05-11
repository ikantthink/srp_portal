export const dynamic = "force-dynamic";

import { resolveShortUrl } from "@/lib/short-urls";

export default async function StandardShortUrlRedirect({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await resolveShortUrl("s", code);
}
