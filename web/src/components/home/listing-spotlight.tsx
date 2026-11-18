"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePause } from "./use-pause";

export type SpotlightListing = {
  key: string;
  src: string;
  alt: string;
  href: string | null;
  title: string;
  place: string;
  status: string;
  /** "Sold over asking" / "Leased over asking": shown with the special badge. */
  over: boolean;
  price: string | null;
};

const SHOW_MS = 5500;
const isRemote = (src: string) => /^https?:\/\//.test(src);

/**
 * Homepage search section's showcase: the newest listing large, slowly zooming, with a caption card
 * that slides up; a row of the next listings underneath with a progress bar on the current one.
 * Rotates every few seconds (cross-fade), pauses on hover/touch/keyboard focus, off screen, and for
 * reduced-motion visitors. Click a thumbnail to jump to it.
 */
export function ListingSpotlight({ listings }: { listings: SpotlightListing[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // The photo underneath during a cross-fade.
  const [previous, setPrevious] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const { paused, handlers } = usePause();
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const show = (i: number) => {
    const next = (i + listings.length) % listings.length;
    if (next === index) return;
    setPrevious(index);
    setIndex(next);
  };

  const rotating = listings.length > 1 && inView && !paused && !reducedMotion;
  const current = listings[index];
  const thumbs = listings;

  const photo = (l: SpotlightListing, className: string, priority = false) => (
    <Image
      src={l.src}
      alt={l.alt}
      fill
      sizes="(min-width: 1024px) 50vw, 100vw"
      unoptimized={isRemote(l.src)}
      preload={priority}
      className={`object-cover ${className}`}
    />
  );

  return (
    <div ref={rootRef} {...handlers} className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-900 sm:aspect-[16/11]">
        {previous !== null && previous !== index && photo(listings[previous], "")}
        <div key={current.key} className="absolute inset-0 photo-fade-in">
          {photo(current, "photo-drift", index === 0)}
        </div>

        {current.href && <Link href={current.href} className="absolute inset-0" aria-label={`View ${current.title}`} />}

        {/* Fills while this listing shows; when it's full the next one fades in. */}
        {listings.length > 1 && !reducedMotion && (
          <span className="absolute inset-x-0 top-0 h-[3px] bg-white/25" aria-hidden="true">
            <span
              key={`bar-${index}`}
              className="review-progress block h-full origin-left bg-aqua-400"
              style={{ animationDuration: `${SHOW_MS}ms`, animationPlayState: rotating ? "running" : "paused" }}
              onAnimationEnd={() => show(index + 1)}
            />
          </span>
        )}

        <div
          key={`caption-${current.key}`}
          className="spotlight-caption pointer-events-none absolute bottom-4 left-4 right-4 flex flex-col gap-1.5 bg-navy-950/85 p-4 text-on-dark sm:right-auto sm:max-w-[min(80%,420px)] sm:p-5"
        >
          <span className="flex flex-wrap items-center gap-2">
            {current.over ? (
              <span className="badge-over">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M15 7h6v6" />
                </svg>
                {current.status}
              </span>
            ) : (
              <span className="bg-aqua-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-navy-900">
                {current.status}
              </span>
            )}
            <span className="text-xs font-semibold text-on-dark-subtle">{current.place}</span>
          </span>
          <span className="font-display text-2xl font-semibold leading-tight sm:text-[28px]">{current.title}</span>
          {current.price && <span className="text-sm font-bold text-aqua-300">{current.price}</span>}
        </div>
      </div>

      {thumbs.length > 1 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6" aria-label="More listings">
          {thumbs.map((l, i) => {
            const active = i === index;
            return (
              <li key={l.key}>
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-label={`Show ${l.title}`}
                  aria-current={active}
                  className={`relative block aspect-[4/3] w-full overflow-hidden bg-cloud-300 transition-opacity duration-500 ${
                    active ? "opacity-100 outline outline-2 outline-offset-2 outline-aqua-400" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={l.src} alt="" fill sizes="120px" unoptimized={isRemote(l.src)} className="object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
