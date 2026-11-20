"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShuffled } from "@/lib/use-shuffled";
import { useDragScroll, usePause } from "./use-pause";

export type ReviewCard = {
  text: string;
  rating: number;
  author: string;
  authorUri?: string | null;
  authorPhoto?: string | null;
  meta: string;
  reviewUri?: string | null;
};

/** How long each review stays highlighted before the row glides to the next (the progress bar shows it). */
const READ_MS = 7000;

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
 * Google reviews, animated like the "Watch PK" reels: a row of cards where one review is
 * highlighted (cyan outline, soft glow, a progress bar filling along its top). When the bar fills,
 * the row glides on to the next review and loops. The others wait, dimmed.
 * Swipe or drag, use the arrows, or tap a dimmed card to jump to it. Pauses briefly after a tap or drag,
 * while off screen or in a hidden tab; reduced-motion visitors get a still row they move themselves.
 */
export function ReviewCarousel({ reviews: original }: { reviews: ReviewCard[] }) {
  const reviews = useShuffled(original);
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [entered, setEntered] = useState(false);
  const { paused, handlers: pauseHandlers } = usePause();
  useDragScroll(trackRef);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const autoScrolling = useRef(false);
  const autoScrollTimer = useRef(0);

  /** Highlights review `index` and glides it to the start of the row. */
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const i = (index + reviews.length) % reviews.length;
      const card = track?.children[i] as HTMLElement | undefined;
      if (!track || !card) return;
      const start = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      autoScrolling.current = true;
      window.clearTimeout(autoScrollTimer.current);
      // Cleared by the browser's scrollend event; this is only a backup for browsers without it.
      autoScrollTimer.current = window.setTimeout(() => (autoScrolling.current = false), 1500);
      setActive(i);
      track.scrollTo({ left: card.offsetLeft - start, behavior: "smooth" });
    },
    [reviews.length],
  );

  // When the visitor swipes, the review at the start of the row becomes the highlighted one.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      if (autoScrolling.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const start = track.scrollLeft + (parseFloat(getComputedStyle(track).paddingLeft) || 0);
        const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        let best = 0;
        let bestDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const distance = Math.abs((child as HTMLElement).offsetLeft - start);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive((current) => {
          if (!atEnd) return best;
          const el = track.children[current] as HTMLElement | undefined;
          const visible = el && el.offsetLeft >= track.scrollLeft && el.offsetLeft + el.offsetWidth <= track.scrollLeft + track.clientWidth;
          return visible && current >= best ? current : best;
        });
      });
    };
    const scrollEnded = () => {
      autoScrolling.current = false;
    };
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("scrollend", scrollEnded);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      track.removeEventListener("scrollend", scrollEnded);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Cards rise in the first time the section appears; the timer only runs while it's on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setEntered(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const running = inView && !paused && !reducedMotion && reviews.length > 1;
  const arrow =
    "flex size-12 items-center justify-center border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-mist-100";

  return (
    <div
      {...pauseHandlers}
    >
      <ul
        ref={trackRef}
        aria-label="Client reviews"
        className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-5 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-6 md:scroll-pl-6 md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r, i) => {
          const isActive = i === active;
          return (
            <li
              key={i}
              // Phone: one review plus a peek. iPad: two. Desktop: three.
              className={`w-[86%] shrink-0 snap-start transition-[opacity,translate] duration-700 ease-out sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] ${
                entered ? "translate-y-0" : "translate-y-6"
              } ${!entered ? "opacity-0" : isActive ? "opacity-100" : "opacity-55 hover:opacity-90"}`}
              style={{ transitionDelay: entered ? "0ms" : `${Math.min(i, 3) * 120}ms` }}
            >
              <figure
                onClick={() => (isActive ? undefined : goTo(i))}
                className={`relative flex h-full flex-col gap-4.5 overflow-hidden border bg-mist-50 p-8 transition-[border-color,box-shadow] duration-500 ${
                  isActive
                    ? "border-aqua-400 shadow-[0_24px_50px_-24px_rgba(0,178,219,0.55)]"
                    : "cursor-pointer border-cloud-300"
                }`}
              >
                {isActive && !reducedMotion && reviews.length > 1 && (
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-cloud-300" aria-hidden="true">
                    <span
                      key={`${i}-${active}`}
                      className="review-progress block h-full origin-left bg-aqua-500"
                      // Hovering or scrolling away pauses the bar where it is; it resumes from there.
                      style={{ animationDuration: `${READ_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => goTo(active + 1)}
                    />
                  </span>
                )}
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
          );
        })}
      </ul>

      {reviews.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {reviews.map((_, i) => (
              <span key={i} className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-500" : "w-4 bg-cloud-400"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous review">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next review">
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
