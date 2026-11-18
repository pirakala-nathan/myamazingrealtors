"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ReviewCard = {
  text: string;
  rating: number;
  author: string;
  authorUri?: string | null;
  authorPhoto?: string | null;
  meta: string;
  reviewUri?: string | null;
};

const AUTO_ADVANCE_MS = 5500;

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="tracking-[3px] text-aqua-500" role="img" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      <span className="text-cloud-400">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/**
 * Horizontally scrollable review cards (swipe, drag the scrollbar, or use the arrows).
 * Advances by itself every few seconds and loops; pauses while the visitor hovers, focuses,
 * touches it or the tab is hidden, and never auto-moves for reduced-motion visitors.
 * Cards fade up as the section scrolls into view.
 */
export function ReviewCarousel({ reviews }: { reviews: ReviewCard[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const cardWidth = () => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.offsetWidth + gap;
  };

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const step = cardWidth();
    const target = index * step;
    track.scrollTo({ left: target > max + 4 ? 0 : Math.min(target, max), behavior: "smooth" });
  }, []);

  const move = (delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    if (delta > 0 && atEnd) goTo(0);
    else if (delta < 0 && track.scrollLeft <= 4) goTo(reviews.length - 1);
    else goTo(active + delta);
  };

  // Track which card is at the left edge, and whether there is anything to scroll.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const step = cardWidth();
      setActive(step ? Math.round(track.scrollLeft / step) : 0);
      setCanScroll(track.scrollWidth > track.clientWidth + 4);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Fade the cards in when the section first comes into view.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (!visible || paused || !canScroll) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      goTo(atEnd ? 0 : active + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [visible, paused, canScroll, active, goTo]);

  const arrow = "flex size-12 items-center justify-center border-[1.5px] border-navy-900 text-ink transition-colors hover:bg-navy-900 hover:text-on-dark disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <ul
        ref={trackRef}
        aria-label="Client reviews"
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:thin] md:mx-0 md:px-0"
      >
        {reviews.map((r, i) => (
          <li
            key={i}
            className={`w-[86%] shrink-0 snap-start transition-all duration-700 ease-out sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] ${
              visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
            style={{ transitionDelay: visible ? `${Math.min(i, 3) * 120}ms` : "0ms" }}
          >
            <figure className="flex h-full flex-col gap-4.5 border border-cloud-300 bg-mist-50 p-8">
              <Stars rating={r.rating} />
              <blockquote className="line-clamp-[8] font-display text-xl italic leading-snug">“{r.text}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 text-sm">
                {r.authorPhoto && (
                  // Google-hosted profile photo, shown as required author credit.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.authorPhoto} alt="" width={36} height={36} className="size-9 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="flex flex-col">
                  {r.authorUri ? (
                    <a href={r.authorUri} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-aqua-700">
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
                        <a href={r.reviewUri} target="_blank" rel="noopener noreferrer" className="underline hover:text-aqua-700">
                          View on Google Maps
                        </a>
                      </>
                    )}
                  </span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {canScroll && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {reviews.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-500" : "w-4 bg-cloud-400"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} onClick={() => move(-1)} aria-label="Previous review">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" className={arrow} onClick={() => move(1)} aria-label="Next review">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
