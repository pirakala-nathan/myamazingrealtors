"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ReelSlide = {
  id: string;
  video: string;
  poster: string | null;
  title: string | null;
  instagramUrl: string | null;
};

const FALLBACK_ADVANCE_MS = 15_000; // if a video can't play, move on anyway

/**
 * "Watch PK" reels: a centred, gliding carousel. The middle reel plays silently and the
 * carousel moves on when it finishes; the others wait, slightly smaller and dimmed.
 * Clicking the middle reel opens a full-screen player with sound.
 * Pauses on hover, focus or touch and when the tab is hidden; no auto-play for reduced motion.
 */
export function ReelCarousel({ reels, igProfile }: { reels: ReelSlide[]; igProfile: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  // Playback progress of the middle reel, tagged with its index so a new reel starts at 0.
  const [progress, setProgress] = useState({ index: 0, value: 0 });
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Only steers playback (nothing rendered depends on it), so reading it on the client is safe.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [open, setOpen] = useState<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const i = (index + reels.length) % reels.length;
      const card = track?.children[i] as HTMLElement | undefined;
      if (!track || !card) return;
      track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
    },
    [reels.length],
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // Which reel is in the middle.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const centre = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
          const el = child as HTMLElement;
          const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centre);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        });
        setActive(best);
      });
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Only play while the section is on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const autoplay = inView && !hovering && open === null && !reducedMotion;

  // Play the middle reel (muted), pause the rest.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === active && autoplay) {
        video.play().catch(() => {});
      } else {
        video.pause();
        if (i !== active) video.currentTime = 0;
      }
    });
  }, [active, autoplay]);

  // Safety net: move on even if a video never fires "ended".
  useEffect(() => {
    if (!autoplay || reels.length < 2) return;
    const id = window.setTimeout(() => {
      if (!document.hidden) next();
    }, FALLBACK_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, autoplay, next, reels.length]);

  // Full-screen player: Esc closes, arrows switch.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % reels.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + reels.length) % reels.length));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, reels.length]);

  const arrow =
    "flex size-12 items-center justify-center border-[1.5px] border-on-dark text-on-dark transition-colors hover:bg-on-dark hover:text-navy-900";
  const current = open === null ? null : reels[open];

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <ul
        ref={trackRef}
        aria-label="Reels"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: "calc(50% - min(36vw, 135px))" }}
      >
        {reels.map((reel, i) => {
          const isActive = i === active;
          return (
            <li
              key={reel.id}
              className={`w-[min(72vw,270px)] shrink-0 snap-center transition-all duration-500 ease-out ${
                isActive ? "scale-100 opacity-100" : "scale-[0.86] opacity-55"
              }`}
            >
              <button
                type="button"
                onClick={() => (isActive ? setOpen(i) : goTo(i))}
                aria-label={isActive ? `Play ${reel.title ?? `reel ${i + 1}`} with sound` : `Show ${reel.title ?? `reel ${i + 1}`}`}
                className={`group relative block aspect-[9/16] w-full overflow-hidden bg-navy-950 text-left ${
                  isActive ? "shadow-[0_24px_60px_-20px_rgba(0,178,219,0.55)] outline outline-2 outline-aqua-400" : ""
                }`}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={reel.video}
                  poster={reel.poster ?? undefined}
                  muted
                  playsInline
                  preload={i === 0 ? "metadata" : "none"}
                  onTimeUpdate={(e) => {
                    if (isActive && e.currentTarget.duration) {
                      setProgress({ index: i, value: e.currentTarget.currentTime / e.currentTarget.duration });
                    }
                  }}
                  onEnded={() => (reels.length > 1 ? next() : undefined)}
                  className="size-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-navy-950/75 px-4 py-3 text-on-dark">
                  <span className="line-clamp-2 text-sm font-bold">{reel.title ?? "Watch"}</span>
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-aqua-400 text-navy-900 transition-transform ${
                      isActive ? "group-hover:scale-110" : ""
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                {isActive && (
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-white/20" aria-hidden="true">
                    <span className="block h-full bg-aqua-400" style={{ width: `${progress.index === i ? progress.value * 100 : 0}%` }} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {reels.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous reel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <div className="flex gap-2" aria-hidden="true">
            {reels.map((r, i) => (
              <span key={r.id} className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-400" : "w-4 bg-navy-500"}`} />
            ))}
          </div>
          <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next reel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? "Reel"}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="flex max-h-full w-full max-w-[min(92vw,calc((100dvh-140px)*9/16))] flex-col gap-3">
            <video
              key={current.id}
              src={current.video}
              poster={current.poster ?? undefined}
              controls
              autoPlay
              playsInline
              className="aspect-[9/16] w-full bg-black"
            />
            <div className="flex items-center justify-between gap-3 text-on-dark">
              <span className="line-clamp-1 text-sm font-bold">{current.title}</span>
              <a
                href={current.instagramUrl ?? igProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-bold text-aqua-300 underline"
              >
                View on Instagram
              </a>
            </div>
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-12 items-center justify-center border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {reels.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setOpen((o) => (o === null ? o : (o - 1 + reels.length) % reels.length))}
                aria-label="Previous reel"
                className="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900 sm:flex"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setOpen((o) => (o === null ? o : (o + 1) % reels.length))}
                aria-label="Next reel"
                className="absolute right-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900 sm:flex"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
