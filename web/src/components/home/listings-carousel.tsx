"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HouseMark } from "@/components/ui/house-mark";
import { useDragScroll } from "./use-pause";

export type CarouselListing = {
  key: string;
  /** Full listing page; null for the sample sales shown until PK has enough listings. */
  href: string | null;
  photos: string[];
  title: string;
  place: string;
  status: string;
  /** "Sold over asking" / "Leased over asking": shown with the special badge. */
  over: boolean;
  price: string | null;
  /** Short key points for the hover panel, e.g. "3 + 1 bedrooms". */
  points: string[];
  /** Label/value pairs for the expanded view. */
  facts: { label: string; value: string }[];
  description: string | null;
};

const ADVANCE_MS = 5000;
const isRemote = (src: string) => /^https?:\/\//.test(src);

function StatusBadge({ l }: { l: CarouselListing }) {
  return l.over ? (
    <span className="badge-over">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
      {l.status}
    </span>
  ) : (
    <span className="bg-aqua-400 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-navy-900">
      {l.status}
    </span>
  );
}

/** Expanded view: photo gallery and the listing's details, over the page. */
function ListingDialog({ l, onClose }: { l: CarouselListing; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = l.photos.length;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setPhoto((p) => (p + 1) % count);
      if (e.key === "ArrowLeft") setPhoto((p) => (p - 1 + count) % count);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [count, onClose]);

  const arrow =
    "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center bg-navy-950/70 text-on-dark transition-colors hover:bg-aqua-400 hover:text-navy-900";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={l.title}
      className="listing-dialog fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/80 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="listing-dialog-panel relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto bg-white lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:overflow-hidden">
        {/* Photos */}
        <div className="flex flex-col gap-2 bg-navy-950 p-2 lg:min-h-0">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              key={l.photos[photo]}
              src={l.photos[photo]}
              alt={`${l.title}, photo ${photo + 1} of ${count}`}
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              unoptimized={isRemote(l.photos[photo])}
              className="photo-fade-in object-cover"
            />
            {count > 1 && (
              <>
                <button type="button" className={`${arrow} left-2`} onClick={() => setPhoto((p) => (p - 1 + count) % count)} aria-label="Previous photo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button type="button" className={`${arrow} right-2`} onClick={() => setPhoto((p) => (p + 1) % count)} aria-label="Next photo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                <span className="absolute bottom-2 right-2 bg-navy-950/75 px-2 py-1 text-xs font-bold text-on-dark">
                  {photo + 1} / {count}
                </span>
              </>
            )}
          </div>
          {count > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {l.photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === photo}
                  className={`relative aspect-[4/3] overflow-hidden transition-opacity ${
                    i === photo ? "outline outline-2 outline-aqua-400" : "opacity-55 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="100px" unoptimized={isRemote(src)} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="relative flex flex-col gap-5 overflow-hidden p-6 sm:p-8 lg:overflow-y-auto">
          <HouseMark className="pointer-events-none absolute -bottom-6 -right-10 w-64 text-aqua-400 opacity-[0.07]" />
          <div className="flex flex-wrap items-center gap-2 pr-12">
            <StatusBadge l={l} />
            <span className="text-sm font-semibold text-muted">{l.place}</span>
          </div>
          <h3 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">{l.title}</h3>
          {l.price && <p className="-mt-2 text-xl font-bold text-aqua-700">{l.price}</p>}

          {l.facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-px border border-cloud-300 bg-cloud-300">
              {l.facts.map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5 bg-white px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{f.label}</dt>
                  <dd className="font-semibold text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {l.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-body">{l.description}</p>}

          <div className="relative mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
            {l.href && (
              <Link
                href={l.href}
                className="inline-flex min-h-12 items-center justify-center bg-navy-900 px-6 font-extrabold text-on-dark transition-colors hover:bg-aqua-400 hover:text-navy-900"
              >
                View full listing
              </Link>
            )}
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center border-[1.5px] border-navy-900 px-6 font-extrabold text-ink transition-colors hover:bg-navy-900 hover:text-on-dark"
            >
              Ask about this home
            </Link>
          </div>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center bg-white text-ink shadow-md transition-colors hover:bg-navy-900 hover:text-on-dark lg:right-4 lg:top-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * "PK's latest listings": every listing in a row that glides on by itself every few seconds.
 * Hovering a card pauses the row and slides up its key points over a faded house mark; "Expand"
 * (or tapping the card on a phone or iPad) opens the full details with a photo gallery.
 * Swipe, drag or use the arrows; pauses off screen and for reduced-motion visitors.
 */
export function ListingsCarousel({ listings }: { listings: CarouselListing[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);
  const [entered, setEntered] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useDragScroll(trackRef);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      // From the last card (or once the end of the row is reached), loop back to the start.
      const i = index >= listings.length || (index > active && atEnd) ? 0 : (index + listings.length) % listings.length;
      const card = track.children[i] as HTMLElement | undefined;
      if (!card) return;
      const start = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      track.scrollTo({ left: card.offsetLeft - start, behavior: "smooth" });
    },
    [active, listings.length],
  );

  // The card nearest the start of the row is the current one (drives the dots).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const start = track.scrollLeft + (parseFloat(getComputedStyle(track).paddingLeft) || 0);
        let best = 0;
        let bestDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const distance = Math.abs((child as HTMLElement).offsetLeft - start);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive(best);
      });
    };
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
    };
  }, []);

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

  // Glide on every few seconds, unless the visitor is reading a card or the details are open.
  useEffect(() => {
    if (!inView || hovering || open !== null || reducedMotion || listings.length < 2) return;
    const id = window.setTimeout(() => {
      if (!document.hidden) goTo(active + 1);
    }, ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, goTo, hovering, inView, listings.length, open, reducedMotion]);

  const close = useCallback(() => setOpen(null), []);
  const arrow =
    "flex size-12 items-center justify-center border-[1.5px] border-navy-900 text-ink transition-colors hover:bg-navy-900 hover:text-on-dark";

  return (
    <div>
      <ul
        ref={trackRef}
        aria-label="Latest listings"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        className="flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] md:scroll-pl-6 md:gap-5 md:px-6 xl:scroll-pl-[calc((100%-80rem)/2+1.5rem)] xl:px-[calc((100%-80rem)/2+1.5rem)] [&::-webkit-scrollbar]:hidden"
      >
        {listings.map((l, i) => (
          <li
            key={l.key}
            // Phone: one card plus a peek. iPad: about two. Desktop: three and a bit.
            className={`w-[min(84vw,340px)] shrink-0 snap-start transition-[opacity,translate] duration-700 ease-out sm:w-[320px] lg:w-[360px] ${
              entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
            style={{ transitionDelay: entered ? "0ms" : `${Math.min(i, 4) * 110}ms` }}
          >
            <article className="group relative flex h-full flex-col bg-white shadow-[0_18px_40px_-28px_rgba(10,29,40,0.45)] transition-shadow duration-500 hover:shadow-[0_26px_54px_-24px_rgba(0,178,219,0.5)]">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Expand ${l.title} for details`}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-cloud-300 text-left"
              >
                {l.photos[0] && (
                  <Image
                    src={l.photos[0]}
                    alt={l.title}
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 84vw"
                    unoptimized={isRemote(l.photos[0])}
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  />
                )}
                <span className="absolute left-3 top-3">
                  <StatusBadge l={l} />
                </span>

                {/* Hover panel: key points over a faded house mark. */}
                <span className="pointer-events-none absolute inset-0 flex flex-col justify-end overflow-hidden bg-gradient-to-t from-navy-950/95 via-navy-950/80 to-navy-950/30 p-5 text-on-dark opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
                  <HouseMark className="absolute -right-8 top-1/2 w-56 -translate-y-1/2 scale-90 text-aqua-400 opacity-0 transition-[opacity,transform] duration-700 group-hover:scale-100 group-hover:opacity-[0.14]" />
                  <span className="relative flex flex-col gap-2">
                    {(l.points.length ? l.points : [l.place]).map((p, n) => (
                      <span
                        key={p}
                        className="flex translate-y-3 items-center gap-2.5 text-[15px] font-semibold opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                        style={{ transitionDelay: `${120 + n * 70}ms` }}
                      >
                        <span className="size-1.5 shrink-0 bg-aqua-400" aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                    <span
                      className="mt-2 inline-flex translate-y-3 items-center gap-2 self-start border border-aqua-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-aqua-300 opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ transitionDelay: `${120 + Math.max(1, l.points.length) * 70}ms` }}
                    >
                      Expand
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </span>
                  </span>
                </span>
              </button>

              <div className="flex flex-1 flex-col gap-1 p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{l.place}</span>
                <h3 className="font-display text-2xl font-semibold leading-tight">{l.title}</h3>
                <span className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="text-sm font-bold text-aqua-700">{l.price ?? (l.points[0] || "")}</span>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="text-sm font-extrabold text-ink underline-offset-4 hover:text-aqua-700 hover:underline"
                  >
                    Details →
                  </button>
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {listings.length > 1 && (
        <div className="container-site mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {listings.map((l, i) => (
              <span key={l.key} className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-500" : "w-4 bg-cloud-400"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous listing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next listing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {open !== null && listings[open] && <ListingDialog l={listings[open]} onClose={close} />}
    </div>
  );
}
