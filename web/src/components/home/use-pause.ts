"use client";

import { useEffect, useRef, useState, type FocusEvent, type RefObject } from "react";

/**
 * Pauses a carousel briefly while a visitor is actively using it, then resumes on its own:
 * - a tap, swipe or mouse drag pauses it for a few seconds;
 * - keyboard focus inside it pauses it until focus leaves.
 * Merely hovering does not pause: a cursor resting on the section made it look frozen.
 */
export function usePause(resumeAfterMs = 6000) {
  const [interacting, setInteracting] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const nudge = () => {
    setInteracting(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setInteracting(false), resumeAfterMs);
  };

  const handlers = {
    onPointerDown: () => nudge(),
    onFocus: (e: FocusEvent) => {
      if ((e.target as HTMLElement).matches(":focus-visible")) setKeyboard(true);
    },
    onBlur: () => setKeyboard(false),
  };

  return { paused: interacting || keyboard, handlers };
}

/**
 * Lets mouse users drag a horizontal row sideways (touch screens already swipe natively).
 * Snapping is switched off while dragging and restored on release, so the row settles on a card.
 * A drag doesn't count as a click, so it won't open a reel or jump to a review by accident.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = false;

    const down = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const move = (e: globalThis.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) {
        moved = true;
        el.style.scrollSnapType = "none";
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }
      el.scrollLeft = startLeft - dx;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "";
      el.style.userSelect = "";
      if (moved) {
        // Let snapping pick the nearest card again.
        const left = el.scrollLeft;
        el.style.scrollSnapType = "";
        el.scrollLeft = left;
      }
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("click", click, true);
    el.style.cursor = "grab";
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("click", click, true);
    };
  }, [ref]);
}
