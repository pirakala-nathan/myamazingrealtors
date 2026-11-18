"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDragScroll, usePause } from "./use-pause";

export type ReelSlide = {
  id: string;
  video: string;
  poster: string | null;
  title: string | null;
  instagramUrl: string | null;
};

const FALLBACK_ADVANCE_MS = 15_000; // if a video can't play, move on anyway

/**
 * "Watch PK" reels: a row lined up with the heading. The first reel in the row plays silently and the
 * row glides to the next when it finishes; the others wait, dimmed.
 * Clicking the playing reel opens a full-screen player with sound.
 * Pauses on hover, focus or touch and when the tab is hidden; no auto-play for reduced motion.
 */
export function ReelCarousel({ reels }: { reels: ReelSlide[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  // Playback progress of the playing reel, tagged with its index so a new reel starts at 0.
  const [progress, setProgress] = useState({ index: 0, value: 0 });
  const [inView, setInView] = useState(false);
  const { paused: hovering, handlers: pauseHandlers } = usePause();
  useDragScroll(trackRef);
  // Only steers playback (nothing rendered depends on it), so reading it on the client is safe.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [open, setOpen] = useState<number | null>(null);
  // Where the full-screen player should start (the preview's position), and the player itself.
  const startAt = useRef(0);
  const playerRef = useRef<HTMLVideoElement>(null);

  /** Opens the full-screen player, continuing from where the silent preview had reached. */
  const openPlayer = (i: number) => {
    startAt.current = videoRefs.current[i]?.currentTime ?? 0;
    setOpen(i);
  };
  /** Closes it; the preview then carries on from where the viewer stopped. */
  const closePlayer = () => {
    const player = playerRef.current;
    const preview = open === null ? null : videoRefs.current[open];
    if (player && preview && open === active && player.currentTime < (player.duration || Infinity) - 0.3) {
      preview.currentTime = player.currentTime;
    }
    setOpen(null);
  };
  /** Next or previous reel inside the player starts from the beginning. */
  const switchPlayer = (delta: number) => {
    startAt.current = 0;
    setOpen((o) => (o === null ? o : (o + delta + reels.length) % reels.length));
  };
  // Latest versions for the keyboard listener below.
  const closePlayerRef = useRef(closePlayer);
  const switchPlayerRef = useRef(switchPlayer);
  useEffect(() => {
    closePlayerRef.current = closePlayer;
    switchPlayerRef.current = switchPlayer;
  });

  // True while the carousel is scrolling itself, so the scroll listener doesn't fight it.
  const autoScrolling = useRef(false);
  const autoScrollTimer = useRef(0);

  /** Brings reel `index` to the start of the row (lined up with the heading) and makes it the playing one. */
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const i = (index + reels.length) % reels.length;
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
    [reels.length],
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);

  // When the visitor swipes or scrolls, the reel at the start of the row becomes the playing one.
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
        // At the far end the last reels can't reach the start of the row; keep the one already playing if visible.
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

  // Only play while the section is on screen.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const autoplay = inView && !hovering && open === null && !reducedMotion;

  // Play the active reel (muted), pause the rest.
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
      if (e.key === "Escape") closePlayerRef.current();
      if (e.key === "ArrowRight") switchPlayerRef.current(1);
      if (e.key === "ArrowLeft") switchPlayerRef.current(-1);
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
      {...pauseHandlers}
    >
      <ul
        ref={trackRef}
        aria-label="Reels"
        // Side padding lines the first reel up with the heading above (same as .container-site).
        className="flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] md:scroll-pl-6 md:gap-5 md:px-6 xl:scroll-pl-[calc((100%-80rem)/2+1.5rem)] xl:px-[calc((100%-80rem)/2+1.5rem)] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => {
          const isActive = i === active;
          return (
            <li
              key={reel.id}
              // Phone: one reel plus a peek of the next. iPad: about three. Desktop: four to five.
              className={`w-[min(68vw,280px)] shrink-0 snap-start transition-opacity duration-500 ease-out sm:w-[240px] lg:w-[260px] ${
                isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
            >
              <button
                type="button"
                onClick={() => (isActive ? openPlayer(i) : goTo(i))}
                aria-label={isActive ? `Play ${reel.title ?? `reel ${i + 1}`} with sound` : `Show ${reel.title ?? `reel ${i + 1}`}`}
                className={`group relative block aspect-[9/16] w-full overflow-hidden bg-navy-950 text-left ${
                  isActive ? "shadow-[0_24px_60px_-20px_rgba(0,178,219,0.55)] outline outline-2 outline-aqua-400" : ""
                }`}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  // Without a preview image, load the first frame so the card isn't blank.
                  src={reel.poster ? reel.video : `${reel.video}#t=0.5`}
                  poster={reel.poster ?? undefined}
                  muted
                  playsInline
                  preload={i === 0 || !reel.poster ? "metadata" : "none"}
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
        <div className="container-site mt-4 flex items-center justify-between gap-4">
          <div className="flex gap-2" aria-hidden="true">
            {reels.map((r, i) => (
              <span key={r.id} className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-400" : "w-4 bg-navy-500"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous reel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next reel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? "Reel"}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePlayer();
          }}
        >
          <div className="flex max-h-full w-full max-w-[min(92vw,calc((100dvh-140px)*9/16))] flex-col gap-3">
            <video
              key={current.id}
              ref={playerRef}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (startAt.current > 0 && startAt.current < v.duration - 0.3) v.currentTime = startAt.current;
              }}
              src={current.video}
              poster={current.poster ?? undefined}
              controls
              autoPlay
              playsInline
              className="aspect-[9/16] w-full bg-black"
            />
            {current.title && <p className="line-clamp-2 text-sm font-bold text-on-dark">{current.title}</p>}
          </div>
          <button
            type="button"
            autoFocus
            onClick={closePlayer}
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
                onClick={() => switchPlayer(-1)}
                aria-label="Previous reel"
                className="absolute left-4 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900 sm:flex"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => switchPlayer(1)}
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
