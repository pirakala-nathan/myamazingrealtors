"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

type Theme = "light" | "dark";

// The current theme lives on <html data-theme>, set before paint by ThemeScript; React just watches it.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const getTheme = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

/** Matches the transition length in .theme-gliding (globals.css). */
const GLIDE_MS = 450;
let glideTimer = 0;

/**
 * Light/dark switch. Every colour on the page glides to its new shade at once (backgrounds, text,
 * borders, icons) and the header logo cross-fades; reduced-motion visitors get an instant switch.
 * The choice is remembered on this device.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const dark = theme === "dark";

  const toggle = () => {
    const next: Theme = dark ? "light" : "dark";
    const root = document.documentElement;
    const apply = () => {
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();

    // Colour glide: for a moment every element transitions its colours (see .theme-gliding in globals.css),
    // then the theme changes, so the whole page shifts to its new shades together, like a change of light.
    window.clearTimeout(glideTimer);
    root.classList.add("theme-gliding");
    void root.offsetWidth; // make sure the transitions are in place before the colours change
    apply();
    glideTimer = window.setTimeout(() => root.classList.remove("theme-gliding"), GLIDE_MS + 100);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      title={dark ? "Light theme" : "Dark theme"}
      className={`relative flex size-11 shrink-0 items-center justify-center overflow-hidden border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-mist-100 ${className}`}
    >
      {/* Sun and moon swap with a turn and a fade. */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={`absolute transition-[transform,opacity] duration-500 ${dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={`absolute transition-[transform,opacity] duration-500 ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
