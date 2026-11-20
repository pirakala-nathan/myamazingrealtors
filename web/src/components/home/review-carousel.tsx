"use client";

import { useEffect, useRef, useState } from "react";
import {
  HOUSE_ROOF,
  HOUSE_VIEWBOX,
  HOUSE_WINDOWS,
} from "@/components/ui/house-mark";
import { useShuffled } from "@/lib/use-shuffled";
import { usePause } from "./use-pause";

export type ReviewCard = {
  text: string;
  rating: number;
  author: string;
  authorUri?: string | null;
  authorPhoto?: string | null;
  meta: string;
  reviewUri?: string | null;
};

/** How long each review stays up. The house's four windows light one by one across this time. */
const READ_MS = 8000;
const WINDOW_MS = READ_MS / HOUSE_WINDOWS.length;

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="tracking-[3px] text-aqua-500"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {"★".repeat(full)}
      <span className="text-cloud-400">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/**
 * Google reviews beside the logo's house mark on a navy tile. The windows light up one at a time as a timer; when
 * all four glow, the next review fades in and the windows go dark again. Pauses on hover, focus or
 * touch and while off screen; swipe, or use the arrows. Reduced-motion visitors get the house fully
 * lit and move through the reviews themselves. Every review is stacked in the same spot, so the
 * section keeps one height and nothing below it jumps.
 */
export function ReviewCarousel({
  reviews: original,
}: {
  reviews: ReviewCard[];
}) {
  const reviews = useShuffled(original);
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const { paused, handlers: pauseHandlers } = usePause();
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const touchX = useRef<number | null>(null);

  const count = reviews.length;
  const go = (delta: number) => setActive((i) => (i + delta + count) % count);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const autoplay = !reducedMotion && count > 1;
  const running = autoplay && inView && !paused;

  const arrow =
    "flex size-12 items-center justify-center border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-mist-100";

  return (
    <div
      ref={rootRef}
      {...pauseHandlers}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client reviews"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      // One card: the navy house panel is its header on phones and its left side on wider screens.
      className="relative grid border border-cloud-300 bg-mist-50 shadow-[0_40px_80px_-50px_rgba(10,29,40,0.45)] md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
    >
      {/* The house: cyan hands for the roof, four windows that light up as the timer. */}
      <div className="relative flex items-center justify-center border-b-[3px] border-aqua-400 bg-navy-900 px-10 py-8 md:border-b-0 md:border-r-[3px] md:px-10 md:py-14">
        <svg
          viewBox={HOUSE_VIEWBOX}
          aria-hidden="true"
          className="w-40 overflow-visible sm:w-48 md:w-full md:max-w-60"
        >
          {HOUSE_ROOF.map((d) => (
            <path key={d} d={d} className="fill-aqua-400" />
          ))}
          {HOUSE_WINDOWS.map((d) => (
            <path key={d} d={d} className="fill-white/12" />
          ))}
          {HOUSE_WINDOWS.map((d, w) => (
            <path
              // A new key per review restarts the windows from dark.
              key={`${active}-${w}`}
              d={d}
              className={autoplay ? "house-window" : "fill-white"}
              style={
                autoplay
                  ? {
                      animationDuration: `${WINDOW_MS}ms`,
                      animationDelay: `${w * WINDOW_MS}ms`,
                      animationPlayState: running ? "running" : "paused",
                    }
                  : undefined
              }
              onAnimationEnd={
                w === HOUSE_WINDOWS.length - 1 ? () => go(1) : undefined
              }
            />
          ))}
        </svg>
      </div>

      <div className="relative flex min-w-0 flex-col justify-center gap-8 p-6 pt-7 sm:p-8 md:p-10 lg:px-14 lg:py-12">
        {/* A large quotation mark, set faintly in the corner. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-2 select-none font-display text-[9rem] leading-none text-aqua-400/15 md:right-10 md:top-4 md:text-[12rem]"
        >
          ”
        </span>
        {/* All reviews share one grid cell, so they cross-fade in place. */}
        <div className="relative grid" aria-live={running ? "off" : "polite"}>
          {reviews.map((r, i) => {
            const on = i === active;
            return (
              <figure
                key={i}
                aria-hidden={!on}
                className={`col-start-1 row-start-1 flex flex-col gap-5 transition-[opacity,translate] duration-700 ease-out ${
                  on
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0"
                }`}
              >
                <Stars rating={r.rating} />
                <blockquote className="line-clamp-[7] font-display text-[clamp(1.4rem,2.3vw,2rem)] italic leading-snug">
                  “{r.text}”
                </blockquote>
                <figcaption className="flex items-center gap-3 text-sm">
                  {r.authorPhoto && (
                    // Google-hosted profile photo, shown as required author credit.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.authorPhoto}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                      className="size-10 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="flex flex-col">
                    {r.authorUri ? (
                      <a
                        href={r.authorUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={on ? undefined : -1}
                        className="font-bold hover:text-aqua-700"
                      >
                        {r.author}
                      </a>
                    ) : (
                      <span className="font-bold">{r.author}</span>
                    )}
                    <span className="text-muted">
                      {r.meta}
                      {r.reviewUri && (
                        <>
                          {" · "}
                          <a
                            href={r.reviewUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={on ? undefined : -1}
                            className="underline hover:text-aqua-700"
                          >
                            View on Google Maps
                          </a>
                        </>
                      )}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {count > 1 && (
          <div className="relative flex items-center gap-5">
            <div className="flex gap-2">
              <button
                type="button"
                className={arrow}
                onClick={() => go(-1)}
                aria-label="Previous review"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                className={arrow}
                onClick={() => go(1)}
                aria-label="Next review"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <p className="text-sm tabular-nums text-muted">
              <span className="font-bold text-ink">{active + 1}</span> / {count}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
