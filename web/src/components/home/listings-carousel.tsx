"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  /** Bedrooms, bathrooms and size: the big numbers in the expanded view. */
  stats: { label: string; value: string }[];
  /** Other details for the expanded view (type, city, MLS®). */
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

const statIcons: Record<string, ReactNode> = {
  Bedrooms: <path d="M3 18v-9m0 5h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5M7 12.5a1.5 1.5 0 1 0 0-.01" />,
  Bathrooms: <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Zm2 0V6a2 2 0 0 1 3.7-1M7 19l-1 2M17 19l1 2" />,
  "Sq ft": <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
};

function DialogButtons({ l }: { l: CarouselListing }) {
  const base =
    "inline-flex min-h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap px-4 text-[15px] font-extrabold transition-colors";
  return (
    <>
      {l.href && (
        <Link href={l.href} className={`${base} bg-navy-900 text-on-dark hover:bg-aqua-400 hover:text-navy-900`}>
          View full listing
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
      <Link href="/contact" className={`${base} border-[1.5px] border-navy-900 text-ink hover:bg-navy-900 hover:text-on-dark`}>
        Ask about this home
      </Link>
    </>
  );
}

/**
 * Expanded view, over the page.
 * Desktop: the photo fills the left side (thumbnails along its bottom edge); on the right, the heading stays
 * at the top, the key numbers, details and description scroll, and the buttons stay pinned at the bottom.
 * Phone and iPad: photo on top, details below, buttons pinned to the bottom of the panel.
 */
function ListingDialog({ l, onClose }: { l: CarouselListing; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const count = l.photos.length;

  // Keep the current thumbnail in view.
  useEffect(() => {
    const thumb = thumbsRef.current?.children[photo] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [photo]);

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
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-white/90 text-ink shadow-md transition-colors hover:bg-aqua-400";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={l.title}
      className="listing-dialog fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/80 sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="listing-dialog-panel relative flex max-h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-white sm:max-h-[calc(100dvh-3rem)] lg:grid lg:h-[min(calc(100dvh-3rem),680px)] lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* Phone/iPad: photo and details scroll together. Desktop: each side is its own grid column. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:contents">
          {/* Photo: fills its side; thumbnails sit along its bottom edge. */}
          <div className="relative aspect-[4/3] shrink-0 bg-navy-950 lg:aspect-auto lg:h-full">
            <Image
              key={l.photos[photo]}
              src={l.photos[photo]}
              alt={`${l.title}, photo ${photo + 1} of ${count}`}
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              unoptimized={isRemote(l.photos[photo])}
              className="photo-fade-in object-cover"
            />
            {count > 1 && (
              <>
                <button type="button" className={`${arrow} left-3`} onClick={() => setPhoto((p) => (p - 1 + count) % count)} aria-label="Previous photo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button type="button" className={`${arrow} right-3`} onClick={() => setPhoto((p) => (p + 1) % count)} aria-label="Next photo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-navy-950/85 to-transparent px-3 pb-3 pt-10">
                  <div ref={thumbsRef} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {l.photos.map((src, i) => (
                      <button
                        key={`${i}-${src}`}
                        type="button"
                        onClick={() => setPhoto(i)}
                        aria-label={`Show photo ${i + 1}`}
                        aria-current={i === photo}
                        className={`relative aspect-[4/3] w-16 shrink-0 overflow-hidden transition-opacity sm:w-20 ${
                          i === photo ? "outline outline-2 -outline-offset-2 outline-aqua-400" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={src} alt="" fill sizes="80px" unoptimized={isRemote(src)} className="object-cover" />
                      </button>
                    ))}
                  </div>
                  <span className="shrink-0 bg-navy-950/80 px-2 py-1 text-xs font-bold tabular-nums text-on-dark">
                    {photo + 1} / {count}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <div className="relative flex flex-col lg:min-h-0 lg:overflow-hidden">
            <HouseMark className="pointer-events-none absolute -right-12 bottom-16 w-72 text-aqua-400 opacity-[0.06]" />

            <header className="relative flex flex-col gap-3 border-b border-cloud-300 px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
              <div className="flex flex-wrap items-center gap-2 pr-12">
                <StatusBadge l={l} />
                <span className="text-sm font-semibold text-muted">{l.place}</span>
              </div>
              <h3 className="font-display text-3xl font-semibold leading-tight sm:text-[38px]">{l.title}</h3>
              {l.price && <p className="text-xl font-bold text-aqua-700">{l.price}</p>}
            </header>

            <div className="relative flex flex-col gap-6 px-6 py-6 sm:px-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {l.stats.length > 0 && (
                <dl className="grid auto-cols-fr grid-flow-col divide-x divide-cloud-300 border border-cloud-300 bg-mist-50">
                  {l.stats.map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-aqua-700">
                        {statIcons[s.label]}
                      </svg>
                      <dt className="order-last text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{s.label}</dt>
                      <dd className="font-display text-2xl font-semibold leading-none text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {l.facts.length > 0 && (
                <dl className="flex flex-col">
                  {l.facts.map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-cloud-300 py-2.5 last:border-b-0">
                      <dt className="text-sm text-muted">{f.label}</dt>
                      <dd className="text-right font-semibold text-ink">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {l.description && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">About this home</h4>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-body">{l.description}</p>
                </div>
              )}
            </div>

            {/* Desktop: buttons stay at the bottom while the details scroll. */}
            <footer className="relative hidden gap-3 border-t border-cloud-300 bg-white px-6 py-4 sm:px-8 lg:flex">
              <DialogButtons l={l} />
            </footer>
          </div>
        </div>

        {/* Phone and iPad: buttons pinned to the bottom of the panel. */}
        <footer className="flex shrink-0 gap-3 border-t border-cloud-300 bg-white px-4 py-3 sm:px-6 lg:hidden">
          <DialogButtons l={l} />
        </footer>

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
            <article
              data-front={i === active}
              className="group relative flex h-full flex-col bg-white shadow-[0_18px_40px_-28px_rgba(10,29,40,0.45)] transition-shadow duration-500 hover:shadow-[0_26px_54px_-24px_rgba(0,178,219,0.5)]">
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

                {/* Key points over a faded house mark: on hover with a mouse; on phones and iPads (touch), on the home at the front of the row. */}
                <span className="pointer-events-none absolute inset-0 flex flex-col justify-end overflow-hidden bg-gradient-to-t from-navy-950/95 via-navy-950/80 to-navy-950/30 p-5 text-on-dark opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:group-data-[front=true]:opacity-100">
                  <HouseMark className="absolute -right-8 top-1/2 w-56 -translate-y-1/2 scale-90 text-aqua-400 opacity-0 transition-[opacity,transform] duration-700 group-hover:scale-100 group-hover:opacity-[0.14] pointer-coarse:group-data-[front=true]:scale-100 pointer-coarse:group-data-[front=true]:opacity-[0.14]" />
                  <span className="relative flex flex-col gap-2">
                    {(l.points.length ? l.points : [l.place]).map((p, n) => (
                      <span
                        key={p}
                        className="flex translate-y-3 items-center gap-2.5 text-[15px] font-semibold opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100 pointer-coarse:group-data-[front=true]:translate-y-0 pointer-coarse:group-data-[front=true]:opacity-100"
                        style={{ transitionDelay: `${120 + n * 70}ms` }}
                      >
                        <span className="size-1.5 shrink-0 bg-aqua-400" aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                    <span
                      className="mt-2 inline-flex translate-y-3 items-center gap-2 self-start border border-aqua-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-aqua-300 opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100 pointer-coarse:group-data-[front=true]:translate-y-0 pointer-coarse:group-data-[front=true]:opacity-100"
                      style={{ transitionDelay: `${120 + Math.max(1, l.points.length) * 70}ms` }}
                    >
                      <span className="pointer-coarse:hidden">Expand</span>
                      <span className="hidden pointer-coarse:inline">Tap for details</span>
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
