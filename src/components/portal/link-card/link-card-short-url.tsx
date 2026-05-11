"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface LinkCardShortUrlProps {
  code: string;
  shortDomain: string;
}

function isLocalhost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

export function LinkCardShortUrl({ code, shortDomain }: LinkCardShortUrlProps) {
  const [copied, setCopied] = useState(false);
  const scheme = isLocalhost(shortDomain) ? "http" : "https";
  const fullUrl = `${scheme}://${shortDomain}/l/${code}`;

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <p className="text-muted-foreground flex items-center gap-2">
      Short URL:{" "}
      <code className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
        {shortDomain}/l/{code}
      </code>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Copy short URL"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </p>
  );
}
