"use client";

import type { ComponentConfig } from "@puckeditor/core";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  filterByMinRating,
  mergeReviews,
  parseManualItems,
  type TestimonialReview,
} from "@/lib/testimonials/reviews";
import { useResponsivePerView } from "../use-responsive-per-view";

export type TestimonialsProps = {
  items: string;
  source: "manual" | "google" | "merge";
  maxReviews: number;
  minRating: number;
  perView: number;
  speed: number;
  maxLines: number;
};

interface FetchState {
  forSource: string | null;
  reviews: TestimonialReview[];
  error: string | null;
}

const INITIAL_FETCH_STATE: FetchState = { forSource: null, reviews: [], error: null };

export const TestimonialsConfig: ComponentConfig<TestimonialsProps> = {
  fields: {
    source: {
      type: "radio",
      label: "Source",
      options: [
        { label: "Manual", value: "manual" },
        { label: "Google Reviews", value: "google" },
        { label: "Merge (manual + Google)", value: "merge" },
      ],
    },
    items: { type: "textarea", label: "Manual items (Name|Quote|Rating|Link per line)" },
    maxReviews: { type: "number", label: "Max reviews (1–50)" },
    minRating: { type: "number", label: "Min star rating (1–5)" },
    perView: { type: "number", label: "Reviews shown at once (1–4)" },
    speed: { type: "number", label: "Autoplay speed in seconds (0 = off)" },
    maxLines: { type: "number", label: "Quote height / max lines before ellipsis (1–20)" },
  },
  defaultProps: {
    items: "Jane D.|They made buying our first home so easy!|5\nJohn S.|Excellent service and communication throughout.|5",
    source: "manual",
    maxReviews: 12,
    minRating: 1,
    perView: 2,
    speed: 5,
    maxLines: 4,
  },
  render: (props) => <TestimonialsView {...props} />,
};

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
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

function TestimonialsView({ items, source, maxReviews, minRating, perView, speed, maxLines }: TestimonialsProps) {
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  const needsGoogle = source === "google" || source === "merge";
  const loading = needsGoogle && fetchState.forSource !== source;
  const googleReviews =
    fetchState.forSource === source ? fetchState.reviews : [];
  const googleError = fetchState.forSource === source ? fetchState.error : null;

  const manual = parseManualItems(items);
  const capped = clamp(maxReviews, 1, 50, 12);
  const min = clamp(minRating, 1, 5, 1);
  const maxPerView = clamp(perView, 1, 4, 2);
  const perViewClamped = useResponsivePerView(maxPerView);
  const speedMs = clamp(speed, 0, 120, 5) * 1000;
  const maxLinesClamped = clamp(maxLines, 1, 20, 4);

  useEffect(() => {
    if (!needsGoogle) return;
    let cancelled = false;
    fetch("/api/testimonials/google")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          reviews?: TestimonialReview[];
          error?: string;
        };
        if (cancelled) return;
        setFetchState({
          forSource: source,
          reviews: json.reviews ?? [],
          error: json.error ?? null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchState({
          forSource: source,
          reviews: [],
          error: err instanceof Error ? err.message : "Failed to load reviews",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [needsGoogle, source]);

  let testimonials: TestimonialReview[] = [];
  if (source === "manual") {
    testimonials = filterByMinRating(manual, min).slice(0, capped);
  } else if (source === "google") {
    testimonials = filterByMinRating(googleReviews, min).slice(0, capped);
  } else {
    testimonials = mergeReviews(manual, googleReviews, capped, min);
  }

  const showGoogleAttribution =
    (source === "google" || source === "merge") &&
    testimonials.some((t) => t.source === "google");
  const isEmpty = !loading && testimonials.length === 0;

  return (
    <section className="px-4 py-12 bg-muted/30 sm:px-6 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 sm:text-3xl sm:mb-10">What Our Clients Say</h2>

        {loading && <SkeletonGrid />}

        {isEmpty && !loading && (
          <div className="rounded-lg border-2 border-dashed border-brand-primary/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {source === "manual"
                ? "Add testimonials in the format Name|Quote|Rating (one per line)."
                : "Configure Google Reviews in Super Admin, or add manual testimonials for merge mode."}
            </p>
            {googleError && (
              <p className="mt-2 text-xs text-muted-foreground">{googleError}</p>
            )}
          </div>
        )}

        {testimonials.length > 0 && (
          <>
            <TestimonialsCarousel
              testimonials={testimonials}
              perView={perViewClamped}
              speedMs={speedMs}
              maxLines={maxLinesClamped}
            />
            {showGoogleAttribution && (
              <p className="mt-6 text-center text-xs text-muted-foreground">Reviews from Google</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ t, maxLines }: { t: TestimonialReview; maxLines: number }) {
  const className =
    "flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md";
  const content = (
    <>
      <div className="mb-3 flex items-center gap-3">
        {t.profilePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Google avatar URL
          <img src={t.profilePhoto} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : null}
        <div className="text-brand-accent">
          {"★".repeat(t.rating)}
          {"☆".repeat(5 - t.rating)}
        </div>
      </div>
      <p
        className="text-sm text-card-foreground mb-4 flex-1"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: maxLines,
          overflow: "hidden",
        }}
      >
        &ldquo;{t.text}&rdquo;
      </p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold text-sm">{t.name}</p>
        {t.time && (
          <p className="text-xs text-muted-foreground shrink-0">
            {t.source === "google" && !t.time.includes("ago") ? relTime(t.time) : t.time}
          </p>
        )}
      </div>
    </>
  );

  return t.reviewUrl ? (
    <a href={t.reviewUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

interface CarouselProps {
  testimonials: TestimonialReview[];
  perView: number;
  speedMs: number;
  maxLines: number;
}

// Auto-advancing, infinite-loop carousel showing `perView` cards. Loop is seamless
// via `perView` cloned slides appended to the end: after sliding onto the clones we
// snap back to index 0 with animation disabled so the reset is invisible.
function TestimonialsCarousel({ testimonials, perView, speedMs, maxLines }: CarouselProps) {
  const n = testimonials.length;
  const loopable = n > perView;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => setIndex(0), [n, perView]);

  useEffect(() => {
    if (!loopable || speedMs <= 0) return;
    const id = setInterval(() => setIndex((i) => i + 1), speedMs);
    return () => clearInterval(id);
  }, [loopable, n, speedMs]);

  // Re-enable the slide transition on the frame after a no-animation snap.
  useEffect(() => {
    if (animate) return;
    const r = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(r);
  }, [animate]);

  if (!loopable) {
    return (
      <div
        className="mx-auto grid max-w-4xl gap-6"
        style={{ gridTemplateColumns: `repeat(${Math.min(n, perView)}, minmax(0, 1fr))` }}
      >
        {testimonials.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} maxLines={maxLines} />
        ))}
      </div>
    );
  }

  const slides = [...testimonials, ...testimonials.slice(0, perView)];
  const step = 100 / perView;

  function handleTransitionEnd() {
    if (index >= n) {
      setAnimate(false);
      setIndex(0);
    }
  }

  function go(dir: 1 | -1) {
    if (dir === -1 && index <= 0) {
      // Jump to the trailing clone (visually identical to index 0), then slide left.
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
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * step}%)`,
            transition: animate ? "transform 500ms ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((t, i) => (
            <div key={i} className="shrink-0 px-3" style={{ flexBasis: `${step}%` }}>
              <TestimonialCard t={t} maxLines={maxLines} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous testimonials"
        className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next testimonials"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition hover:bg-muted"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-2 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mb-4 h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
