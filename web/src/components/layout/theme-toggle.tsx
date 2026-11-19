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

/**
 * Light/dark switch. The new theme sweeps across the page in a growing circle that starts at the
 * button (View Transitions API); browsers without it get a short colour fade, and reduced-motion
 * visitors get an instant switch. The choice is remembered on this device.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as Theme);
  const dark = theme === "dark";

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next: Theme = dark ? "light" : "dark";
    const root = document.documentElement;
    const apply = () => {
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {}
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();

    if (!("startViewTransition" in document)) {
      root.classList.add("theme-fading");
      apply();
      window.setTimeout(() => root.classList.remove("theme-fading"), 500);
      return;
    }

    // Circle grows from the middle of the button to the farthest corner of the screen.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 650, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
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
