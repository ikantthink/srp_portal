"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type YouTubeFeedProps = {
  heading: string;
  mode: "channel" | "manual";
  channelId: string;
  videoIds: string;
  count: number;
  order: "date" | "viewCount" | "relevance";
  cardWidth: "sm" | "md" | "lg";
  showTitle: boolean;
  showMeta: boolean;
};

interface Video {
  id: string;
  title: string;
  publishedAt?: string;
  viewCount?: number;
  thumbnail: string;
}

const CARD_WIDTH_PX: Record<YouTubeFeedProps["cardWidth"], number> = {
  sm: 240,
  md: 320,
  lg: 400,
};

export const YouTubeFeedConfig: ComponentConfig<YouTubeFeedProps> = {
  fields: {
    heading: { type: "text", label: "Heading (optional)" },
    mode: {
      type: "radio",
      label: "Source",
      options: [
        { label: "Channel", value: "channel" },
        { label: "Manual list", value: "manual" },
      ],
    },
    channelId: { type: "text", label: "Channel ID (UC…)" },
    videoIds: { type: "textarea", label: "Video IDs (manual mode, one per line)" },
    count: { type: "number", label: "Max videos (1–50)" },
    order: {
      type: "radio",
      label: "Order (channel + API key only)",
      options: [
        { label: "Newest first", value: "date" },
        { label: "Most viewed", value: "viewCount" },
        { label: "Relevance", value: "relevance" },
      ],
    },
    cardWidth: {
      type: "radio",
      label: "Card size",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    showTitle: {
      type: "radio",
      label: "Show title",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showMeta: {
      type: "radio",
      label: "Show date + views",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  defaultProps: {
    heading: "",
    mode: "channel",
    channelId: "",
    videoIds: "",
    count: 12,
    order: "date",
    cardWidth: "md",
    showTitle: true,
    showMeta: true,
  },
  render: (props) => <YouTubeFeedView {...props} />,
};

function buildQuery(props: YouTubeFeedProps): string | null {
  const qs = new URLSearchParams();
  qs.set("mode", props.mode);
  qs.set("count", String(Math.max(1, Math.min(50, Math.floor(props.count || 12)))));
  if (props.mode === "channel") {
    if (!props.channelId) return null;
    qs.set("channelId", props.channelId.trim());
    qs.set("order", props.order);
  } else {
    const ids = props.videoIds
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return null;
    qs.set("ids", ids.join(","));
  }
  return qs.toString();
}

interface FetchState {
  forQuery: string | null;
  videos: Video[];
  error: string | null;
}

const INITIAL_FETCH_STATE: FetchState = { forQuery: null, videos: [], error: null };

function YouTubeFeedView(props: YouTubeFeedProps) {
  const { heading, cardWidth, showTitle, showMeta } = props;
  // Bundle the per-query response into a single piece of state so we never
  // need to set multiple flags synchronously inside the effect body — the
  // react-hooks/set-state-in-effect rule disallows that pattern. `loading`
  // is then derived from "the current state was loaded for the current
  // query".
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const widthPx = CARD_WIDTH_PX[cardWidth];

  const query = buildQuery(props);
  const loading = query !== null && fetchState.forQuery !== query;
  const videos = fetchState.forQuery === query ? fetchState.videos : [];
  const error = fetchState.forQuery === query ? fetchState.error : null;

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    fetch(`/api/youtube/feed?${query}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { videos?: Video[]; error?: string };
        if (cancelled) return;
        setFetchState({ forQuery: query, videos: json.videos ?? [], error: json.error ?? null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchState({
          forQuery: query,
          videos: [],
          error: err instanceof Error ? err.message : "Failed to load videos",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < max);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateScrollState();
    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, videos.length]);

  function scrollByStep(direction: 1 | -1) {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * (widthPx + 16), behavior: "smooth" });
  }

  const hasContent = videos.length > 0;
  const isEmpty = !loading && !hasContent;

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{heading}</h2>
        )}

        {loading && <SkeletonRow widthPx={widthPx} />}

        {isEmpty && (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Configure a YouTube channel ID or paste video IDs to display videos here.
            </p>
            {error && (
              <p className="mt-2 text-xs text-muted-foreground">{error}</p>
            )}
          </div>
        )}

        {hasContent && (
          <div className="relative">
            <button
              type="button"
              aria-label="Scroll previous"
              onClick={() => scrollByStep(-1)}
              className={`absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-2 shadow-md ring-1 ring-border transition md:flex ${
                canPrev ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll next"
              onClick={() => scrollByStep(1)}
              className={`absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-2 shadow-md ring-1 ring-border transition md:flex ${
                canNext ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Edge fades — only visible when there's content to scroll to in
                that direction. Pointer-events off so they don't intercept
                card clicks. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r from-background to-transparent transition-opacity ${
                canPrev ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l from-background to-transparent transition-opacity ${
                canNext ? "opacity-100" : "opacity-0"
              }`}
            />

            <ul
              ref={listRef}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none" }}
            >
              {/* webkit scrollbar hider — scoped to this list */}
              <style>{`section ul::-webkit-scrollbar { display: none; }`}</style>
              {videos.map((v) => (
                <li
                  key={v.id}
                  className="snap-start shrink-0"
                  style={{ width: widthPx }}
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail; next/image would require remotePatterns for i.ytimg.com */}
                      <img
                        src={v.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    {showTitle && v.title && (
                      <p className="mt-2 text-sm font-medium line-clamp-2">{v.title}</p>
                    )}
                    {showMeta && (v.publishedAt || v.viewCount !== undefined) && (
                      <p className="text-xs text-muted-foreground">
                        {v.publishedAt && relTime(v.publishedAt)}
                        {v.viewCount !== undefined && (
                          <>
                            {v.publishedAt ? " · " : ""}
                            {formatCount(v.viewCount)} views
                          </>
                        )}
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function SkeletonRow({ widthPx }: { widthPx: number }) {
  return (
    <ul className="flex gap-4 overflow-hidden pb-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="shrink-0" style={{ width: widthPx }}>
          <div className="aspect-video animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(day / 365);
  return `${yr}y ago`;
}

function formatCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0).replace(/\.0$/, "")}M`;
  return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
}
