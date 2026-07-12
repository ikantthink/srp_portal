"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useResponsivePerView } from "../use-responsive-per-view";

export type YouTubeFeedProps = {
  heading: string;
  mode: "channel" | "manual";
  channelId: string;
  videoIds: string;
  count: number;
  order: "date" | "viewCount" | "relevance";
  perView: number;
  gap: number;
  showTitle: boolean;
  showMeta: boolean;
  autoScrollSpeed: number;
};

interface Video {
  id: string;
  title: string;
  publishedAt?: string;
  viewCount?: number;
  thumbnail: string;
}

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

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
    perView: { type: "number", label: "Videos shown at once (1–6)" },
    gap: { type: "number", label: "Gap between videos (px)" },
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
    autoScrollSpeed: {
      type: "number",
      label: "Autoplay speed in seconds (0 = off)",
    },
  },
  defaultProps: {
    heading: "",
    mode: "channel",
    channelId: "",
    videoIds: "",
    count: 12,
    order: "date",
    perView: 4,
    gap: 16,
    showTitle: true,
    showMeta: true,
    autoScrollSpeed: 0,
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
  const { heading, showTitle, showMeta, autoScrollSpeed } = props;
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const maxPerView = clamp(props.perView, 1, 6, 4);
  const perView = useResponsivePerView(maxPerView);
  const gap = clamp(props.gap, 0, 64, 16);
  const speedMs = clamp(autoScrollSpeed, 0, 120, 0) * 1000;

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

  const hasContent = videos.length > 0;
  const isEmpty = !loading && !hasContent;

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{heading}</h2>
        )}

        {loading && <SkeletonRow perView={perView} gap={gap} />}

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
          <YouTubeCarousel
            videos={videos}
            perView={perView}
            gap={gap}
            showTitle={showTitle}
            showMeta={showMeta}
            speedMs={speedMs}
          />
        )}
      </div>
    </section>
  );
}

function VideoCard({
  v,
  showTitle,
  showMeta,
}: {
  v: Video;
  showTitle: boolean;
  showMeta: boolean;
}) {
  return (
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
  );
}

interface CarouselProps {
  videos: Video[];
  perView: number;
  gap: number;
  showTitle: boolean;
  showMeta: boolean;
  speedMs: number;
}

// Same infinite-loop carousel pattern as Testimonials: cloned trailing slides +
// snap-back after transition so the reset is invisible. Slide width is a
// percentage of the row (100 / perView), so cards always fit the container —
// no fixed pixel width to overflow or get clipped by the edge fades.
function YouTubeCarousel({ videos, perView, gap, showTitle, showMeta, speedMs }: CarouselProps) {
  const n = videos.length;
  const loopable = n > perView;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const stepPercent = 100 / perView;

  useEffect(() => setIndex(0), [n, perView]);

  useEffect(() => {
    if (!loopable || speedMs <= 0) return;
    const id = setInterval(() => setIndex((i) => i + 1), speedMs);
    return () => clearInterval(id);
  }, [loopable, n, speedMs]);

  useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  if (!loopable) {
    return (
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(n, perView)}, minmax(0, 1fr))`, gap }}>
        {videos.map((v) => (
          <li key={v.id}>
            <VideoCard v={v} showTitle={showTitle} showMeta={showMeta} />
          </li>
        ))}
      </ul>
    );
  }

  const slides = [...videos, ...videos.slice(0, perView)];

  function handleTransitionEnd() {
    if (index >= n) {
      setAnimate(false);
      setIndex(0);
    }
  }

  function go(dir: 1 | -1) {
    if (dir === -1 && index <= 0) {
      setAnimate(false);
      setIndex(n);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(n - 1);
        })
      );
      return;
    }
    setIndex((i) => i + dir);
  }

  return (
    <div className="relative px-12">
      <button
        type="button"
        aria-label="Scroll previous"
        onClick={() => go(-1)}
        className="absolute left-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-2 shadow-md ring-1 ring-border transition"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Scroll next"
        onClick={() => go(1)}
        className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-background/90 p-2 shadow-md ring-1 ring-border transition"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="overflow-hidden">
        <ul
          className="flex"
          style={{
            transform: `translateX(-${index * stepPercent}%)`,
            transition: animate ? "transform 500ms ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((v, i) => (
            <li
              key={`${v.id}-${i}`}
              className="shrink-0"
              style={{ flexBasis: `${stepPercent}%`, paddingRight: gap }}
            >
              <VideoCard v={v} showTitle={showTitle} showMeta={showMeta} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SkeletonRow({ perView, gap }: { perView: number; gap: number }) {
  return (
    <ul className="grid" style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))`, gap }}>
      {Array.from({ length: Math.min(3, perView) }, (_, i) => (
        <li key={i}>
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
