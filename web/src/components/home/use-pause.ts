"use client";

import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";

/**
 * Pauses a carousel while a visitor is engaging with it, and resumes on its own:
 * - mouse: paused while the pointer is over it;
 * - touch (phones, iPads): paused for a few seconds after each tap or swipe, since touch screens
 *   never send a "pointer left" event;
 * - keyboard: paused while focus is inside it (only for keyboard focus, so a tapped button doesn't keep it paused).
 */
export function usePause(resumeAfterTouchMs = 6000) {
  const [hover, setHover] = useState(false);
  const [touch, setTouch] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handlers = {
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "mouse") setHover(true);
    },
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType === "mouse") setHover(false);
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      setTouch(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setTouch(false), resumeAfterTouchMs);
    },
    onFocus: (e: FocusEvent) => {
      if ((e.target as HTMLElement).matches(":focus-visible")) setKeyboard(true);
    },
    onBlur: () => setKeyboard(false),
  };

  return { paused: hover || touch || keyboard, handlers };
}
