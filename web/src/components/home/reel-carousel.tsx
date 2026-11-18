"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HouseLoader } from "@/components/ui/house-loader";
import { useDragScroll, usePause } from "./use-pause";

/** Loader over a video that is buffering. It fades in after a short delay, so quick starts never flash it. */
function BufferingOverlay({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden={!show}
      className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-navy-950/40 transition-opacity ${
        show ? "opacity-100 delay-300 duration-300" : "opacity-0 duration-150"
      }`}
    >
      {show && <HouseLoader tone="dark" size="sm" showLabel={false} label="Loading video" />}
    </span>
  );
}

/** iPads and computers get the 1080p version in the full-screen player; phones the lighter one. */
const LARGE_SCREEN = "(min-width: 768px)";
const subscribeLargeScreen = (onChange: () => void) => {
  const query = window.matchMedia(LARGE_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const useLargeScreen = () =>
  useSyncExternalStore(
    subscribeLargeScreen,
    () => window.matchMedia(LARGE_SCREEN).matches,
    () => false,
  );

export type ReelSlide = {
  id: string;
  video: string;
  /** 1080p copy for the full-screen player on large screens; falls back to `video`. */
  videoHd: string | null;
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
  const closeRef = useRef<HTMLButtonElement>(null);
  // True from shortly before the section scrolls into view, so the previews are buffered by the time they show.
  const [near, setNear] = useState(false);
  // The player stays mounted (hidden) and loads the reel the visitor is likely to open next, so expanding
  // is instant: the playing reel, or one the visitor points at (counted only while the same reel still plays
  // in the row). `eager` turns on full buffering once they hover, focus or touch a reel.
  const [hovered, setHovered] = useState<{
    index: number;
    whileActive: number;
  } | null>(null);
  const [eager, setEager] = useState(false);
  // Which preview is waiting for data, and whether the full-screen player is.
  const [previewBuffering, setPreviewBuffering] = useState<number | null>(null);
  const [playerBuffering, setPlayerBuffering] = useState(false);
  const warmUp = (i: number) => {
    setHovered({ index: i, whileActive: active });
    setEager(true);
  };
  // Mouse hover preview: which reel is being pointed at, and reels that should start buffering.
  const [previewing, setPreviewing] = useState<number | null>(null);
  const [warmed, setWarmed] = useState<number[]>([]);
  const previewTimer = useRef(0);
  // How the last tap or click was made ("mouse", "touch" or "pen"), to tell a phone tap from a mouse click.
  const lastPointer = useRef("mouse");
  useEffect(() => () => window.clearTimeout(previewTimer.current), []);
  const startPreview = (i: number) => {
    setWarmed((w) => (w.includes(i) ? w : [...w, i]));
    window.clearTimeout(previewTimer.current);
    // A short pause so sweeping the mouse across the row doesn't start every reel.
    previewTimer.current = window.setTimeout(() => setPreviewing(i), 120);
  };
  const stopPreview = () => {
    window.clearTimeout(previewTimer.current);
    setPreviewing(null);
  };

  /*
   * HD on large screens. The player always opens with the light version (the same file as the preview,
   * already downloaded, so it starts at once). On iPads and computers the 1080p version then loads in a
   * second, hidden player, only while the reel is open, so it never competes with the previews for
   * bandwidth. Once it can play from the current moment it takes over seamlessly.
   */
  const hdRef = useRef<HTMLVideoElement>(null);
  const [hdReady, setHdReady] = useState<string | null>(null);
  /** Whichever player is showing. */
  const showing = () => (hdReady !== null && hdRef.current ? hdRef.current : playerRef.current);

  /** Opens the full-screen player, continuing from where the silent preview had reached. */
  const openPlayer = (i: number) => {
    startAt.current = videoRefs.current[i]?.currentTime ?? 0;
    setOpen(i);
  };
  /** Closes it; the preview then carries on from where the viewer stopped. */
  const closePlayer = () => {
    const player = showing();
    const preview = open === null ? null : videoRefs.current[open];
    if (player && preview && player.currentTime < (player.duration || Infinity) - 0.3) {
      preview.currentTime = player.currentTime;
    }
    playerRef.current?.pause();
    hdRef.current?.pause();
    setHdReady(null);
    setOpen(null);
  };
  /** Next or previous reel inside the player starts from the beginning. */
  const switchPlayer = (delta: number) => {
    if (open === null) return;
    const i = (open + delta + reels.length) % reels.length;
    startAt.current = 0;
    hdRef.current?.pause();
    setHdReady(null);
    setOpen(i);
  };

  // Opening: if the warmed-up player already has this reel, jump to the preview's moment and play at once;
  // otherwise its new source loads and onLoadedMetadata does the same.
  useEffect(() => {
    const player = playerRef.current;
    if (open === null || !player) return;
    closeRef.current?.focus();
    if (player.readyState >= HTMLMediaElement.HAVE_METADATA) {
      const t = startAt.current;
      player.currentTime = t > 0 && t < player.duration - 0.3 ? t : 0;
      player.play().catch(() => {});
    }
  }, [open]); // Latest versions for the keyboard listener below.
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
      // A swipe ends a tap-to-preview: the reel at the front plays again.
      if (lastPointer.current !== "mouse") setPreviewing(null);
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
          const visible =
            el &&
            el.offsetLeft >= track.scrollLeft &&
            el.offsetLeft + el.offsetWidth <= track.scrollLeft + track.clientWidth;
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
    // Starts loading about a screen before the section arrives; once on, it stays on.
    const early = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          early.disconnect();
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    early.observe(track);
    // Also start a few seconds after the page loads, so a jump straight to Videos finds the first reel ready.
    const timer = window.setTimeout(() => setNear(true), 3000);
    return () => {
      observer.disconnect();
      early.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const autoplay = inView && !hovering && open === null && !reducedMotion;
  // With a mouse, pointing at a reel plays its preview (and holds the row still) until the pointer leaves.
  const playing = previewing ?? active;
  const playOn = previewing !== null ? open === null : autoplay;

  // Play the current reel (muted), pause the rest.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === playing && playOn) {
        video.play().catch(() => {});
      } else {
        video.pause();
        if (i !== active && i !== previewing) video.currentTime = 0;
      }
    });
  }, [active, playing, playOn, previewing]);

  // Safety net: move on even if a video never fires "ended".
  useEffect(() => {
    if (!autoplay || previewing !== null || reels.length < 2) return;
    const id = window.setTimeout(() => {
      if (!document.hidden) next();
    }, FALLBACK_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [active, autoplay, next, previewing, reels.length]);

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
  const playerIndex = open ?? (hovered && hovered.whileActive === active ? hovered.index : active);
  const current = reels[playerIndex];
  const largeScreen = useLargeScreen();
  const hdSrc = open !== null && current && largeScreen ? current.videoHd : null;
  const hdShowing = hdSrc !== null && hdReady === current?.id;
  const currentId = current?.id ?? null;

  /*
   * Light → HD hand-over, without a freeze:
   * 1. While the light version keeps playing, the hidden HD player is parked a few seconds ahead and buffers there.
   * 2. When the light version reaches that point and HD has several seconds ready, HD starts and the light version
   *    stops at the same instant, so playback carries on in step.
   * 3. If HD isn't ready in time, it's parked further ahead and tries again. If HD stalls after taking over,
   *    playback drops back to the light version at the same moment and HD tries again later.
   */
  useEffect(() => {
    const hd = hdRef.current;
    const light = playerRef.current;
    if (!hdSrc || !hd || !light || !currentId) return;

    const LEAD = 4; // seconds ahead to park HD
    const NEED = 4; // seconds HD must have buffered from that point
    let target = -1;
    let attempts = 0;
    let frame = 0;
    let retry = 0;
    let stallTimer = 0;
    let swapped = false;
    let stopped = false;

    const ahead = (v: HTMLVideoElement, t: number) => {
      for (let i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= t + 0.1 && v.buffered.end(i) >= t) return v.buffered.end(i) - t;
      }
      return 0;
    };
    const park = () => {
      const duration = light.duration || hd.duration || Infinity;
      target = light.currentTime + LEAD * (attempts + 1);
      attempts += 1;
      // Too close to the end to be worth it: stay on the light version.
      if (target > duration - 2) {
        target = -1;
        return;
      }
      hd.currentTime = target;
    };
    // HD starts playing silently, hidden, in step with the light version (a paused hidden video takes about a
    // second to wake up). The visible swap happens only once HD is confirmed moving at the same moment.
    let syncing = false;
    let syncStart = 0;
    const startSync = () => {
      syncing = true;
      syncStart = performance.now();
      hd.muted = true;
      hd.play().catch(() => {});
    };
    const handOver = () => {
      syncing = false;
      hd.muted = light.muted;
      hd.volume = light.volume;
      light.pause();
      swapped = true;
      setHdReady(currentId);
    };
    const abandonSync = () => {
      syncing = false;
      hd.pause();
      park();
    };
    const fallBack = () => {
      // HD stalled: carry on with the light version from the same moment, and try HD again later.
      light.currentTime = hd.currentTime;
      light.muted = hd.muted;
      light.volume = hd.volume;
      light.play().catch(() => {});
      hd.pause();
      swapped = false;
      syncing = false;
      attempts = 0;
      target = -1;
      setHdReady(null);
      retry = window.setTimeout(() => {
        if (!stopped) watch();
      }, 8000);
    };
    const watch = () => {
      frame = requestAnimationFrame(() => {
        if (stopped || swapped) return;
        if (hd.readyState < HTMLMediaElement.HAVE_METADATA) return watch();
        const duration = light.duration || hd.duration || Infinity;
        if (syncing) {
          // Positive: HD is behind the light version; negative: ahead of it.
          const gap = light.currentTime - hd.currentTime;
          if (!hd.paused && hd.currentTime > target + 0.1) {
            // Level (within a couple of frames): show HD.
            if (Math.abs(gap) < 0.08) {
              hd.playbackRate = 1;
              return handOver();
            }
            // Otherwise nudge HD's speed slightly until it lines up (no seeking, so no stall).
            hd.playbackRate = gap > 0 ? 1.25 : 0.8;
          }
          // The viewer paused or jumped, or it isn't lining up: park HD ahead again.
          if (light.paused || Math.abs(gap) > 3 || performance.now() - syncStart > 6000) {
            hd.playbackRate = 1;
            abandonSync();
          }
          return watch();
        }
        // Start (or restart after the viewer jumps around) by parking HD ahead of the light version.
        if (target < 0 || light.currentTime > target + 0.5 || light.currentTime < target - LEAD * 4) {
          attempts = 0;
          park();
          if (target < 0) return;
          return watch();
        }
        const ready =
          !hd.seeking &&
          hd.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA &&
          ahead(hd, target) >= Math.min(NEED, duration - target - 0.2);
        // Start HD a moment before the light version reaches its parked spot, to allow for its wake-up time.
        if (light.currentTime >= target - 1.2) {
          if (ready && !light.paused) {
            startSync();
            return watch();
          }
          // Not ready by the time the light version gets there: park a bit further ahead.
          if (!ready && light.currentTime >= target - 0.03 && attempts < 4) park();
        }
        watch();
      });
    };
    const onWaiting = () => {
      if (!swapped) return;
      window.clearTimeout(stallTimer);
      stallTimer = window.setTimeout(() => {
        if (swapped && hd.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) fallBack();
      }, 1200);
    };
    const onPlaying = () => window.clearTimeout(stallTimer);
    hd.addEventListener("waiting", onWaiting);
    hd.addEventListener("playing", onPlaying);
    watch();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.clearTimeout(stallTimer);
      hd.removeEventListener("waiting", onWaiting);
      hd.removeEventListener("playing", onPlaying);
    };
  }, [hdSrc, currentId]);

  return (
    <div {...pauseHandlers}>
      <ul
        ref={trackRef}
        aria-label="Reels"
        // Side padding lines the first reel up with the heading above (same as .container-site).
        className="flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] md:scroll-pl-6 md:gap-5 md:px-6 xl:scroll-pl-[calc((100%-80rem)/2+1.5rem)] xl:px-[calc((100%-80rem)/2+1.5rem)] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => {
          // The reel that's playing: the one pointed at with a mouse, otherwise the row's current one.
          const isActive = i === playing;
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
                onClick={() => {
                  if (isActive) return openPlayer(i);
                  // Touch (phones, iPads): the first tap plays this reel's preview where it is, like hovering
                  // with a mouse; tapping it again opens it full screen. Mouse and keyboard bring it to the front.
                  if (lastPointer.current === "touch" || lastPointer.current === "pen") {
                    window.clearTimeout(previewTimer.current);
                    setWarmed((w) => (w.includes(i) ? w : [...w, i]));
                    setPreviewing(i);
                  } else goTo(i);
                }}
                // Mouse: play this reel's preview while pointed at, and start loading the full-screen version.
                onPointerEnter={(e) => {
                  warmUp(i);
                  if (e.pointerType === "mouse") startPreview(i);
                }}
                onPointerLeave={(e) => e.pointerType === "mouse" && stopPreview()}
                onPointerDown={(e) => {
                  lastPointer.current = e.pointerType;
                  warmUp(i);
                  // Start loading as soon as a finger lands, so the preview is ready by the time it lifts.
                  if (e.pointerType !== "mouse") setWarmed((w) => (w.includes(i) ? w : [...w, i]));
                }}
                onFocus={() => warmUp(i)}
                aria-label={
                  isActive
                    ? `Play ${reel.title ?? `reel ${i + 1}`} with sound`
                    : `Show ${reel.title ?? `reel ${i + 1}`}`
                }
                className={`group relative block aspect-[9/16] w-full overflow-hidden bg-navy-950 text-left ${
                  isActive ? "shadow-[0_24px_60px_-20px_rgba(0,178,219,0.55)] outline outline-2 outline-aqua-400" : ""
                }`}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                    // iPhones and iPads only autoplay videos that are muted in the page itself (React's
                    // `muted` prop doesn't always reach the HTML), so set it directly too.
                    if (el && !el.hasAttribute("muted")) {
                      el.defaultMuted = true;
                      el.muted = true;
                      el.setAttribute("muted", "");
                    }
                  }}
                  // Without a preview image, load the first frame so the card isn't blank.
                  src={reel.poster ? reel.video : `${reel.video}#t=0.5`}
                  poster={reel.poster ?? undefined}
                  muted
                  playsInline
                  // The playing reel and the one after it buffer ahead, so neither stalls when its turn comes.
                  preload={
                    (near && (i === active || i === (active + 1) % reels.length)) || warmed.includes(i)
                      ? "auto"
                      : i === 0 || !reel.poster
                        ? "metadata"
                        : "none"
                  }
                  onTimeUpdate={(e) => {
                    if (isActive && e.currentTarget.duration) {
                      setProgress({
                        index: i,
                        value: e.currentTarget.currentTime / e.currentTarget.duration,
                      });
                    }
                  }}
                  onEnded={(e) => {
                    // A reel being pointed at loops; otherwise the row moves on.
                    if (i === previewing) {
                      e.currentTarget.currentTime = 0;
                      e.currentTarget.play().catch(() => {});
                    } else if (i === active && reels.length > 1) next();
                  }}
                  onWaiting={() => setPreviewBuffering(i)}
                  onPlaying={() => setPreviewBuffering((b) => (b === i ? null : b))}
                  className="size-full object-cover"
                />
                <BufferingOverlay show={isActive && playOn && previewBuffering === i} />
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
                    <span
                      className="block h-full bg-aqua-400"
                      style={{
                        width: `${progress.index === i ? progress.value * 100 : 0}%`,
                      }}
                    />
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
              <span
                key={r.id}
                className={`h-[3px] transition-all duration-500 ${i === active ? "w-10 bg-aqua-400" : "w-4 bg-navy-500"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous reel">
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
            <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next reel">
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
        </div>
      )}

      {current && (
        // Always mounted so the player can load ahead of time; shown only while a reel is open.
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title ?? "Reel"}
          hidden={open === null}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 [&[hidden]]:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePlayer();
          }}
        >
          <div className="relative flex max-h-full w-full max-w-[min(92vw,calc((100dvh-140px)*9/16))] flex-col gap-3">
            <video
              onLoadStart={() => setPlayerBuffering(true)}
              onWaiting={() => setPlayerBuffering(true)}
              onPlaying={() => setPlayerBuffering(false)}
              onPause={() => setPlayerBuffering(false)}
              ref={playerRef}
              onLoadedMetadata={(e) => {
                // A different reel than the warmed-up one was opened: start once it has loaded.
                if (open === null) return;
                const v = e.currentTarget;
                const t = startAt.current;
                v.currentTime = t > 0 && t < v.duration - 0.3 ? t : 0;
                v.play().catch(() => {});
              }}
              src={current.video}
              poster={current.poster ?? undefined}
              // "auto" buffers the whole reel; until the visitor shows interest, only its size and first frame.
              preload={eager ? "auto" : "metadata"}
              controls={!hdShowing}
              playsInline
              className="aspect-[9/16] w-full bg-black"
            />
            {hdSrc && (
              <video
                key={current.id}
                ref={hdRef}
                src={hdSrc}
                preload="auto"
                muted
                playsInline
                controls={hdShowing}
                aria-hidden={!hdShowing}
                tabIndex={hdShowing ? 0 : -1}
                onWaiting={() => hdShowing && setPlayerBuffering(true)}
                onPlaying={() => setPlayerBuffering(false)}
                className={`absolute inset-x-0 top-0 aspect-[9/16] w-full bg-black transition-opacity duration-300 ${
                  hdShowing ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              />
            )}
            {/* Covers only the picture, not the title underneath. */}
            <span className="pointer-events-none absolute inset-x-0 top-0 aspect-[9/16]">
              <BufferingOverlay show={open !== null && playerBuffering} />
            </span>
            {current.title && <p className="line-clamp-2 text-sm font-bold text-on-dark">{current.title}</p>}
          </div>
          <button
            type="button"
            ref={closeRef}
            onClick={closePlayer}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-12 items-center justify-center border-[1.5px] border-on-dark text-on-dark hover:bg-on-dark hover:text-navy-900"
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
