"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Wraps a section's columns so they rise and fade in the first time it scrolls into view (see .reveal in globals.css). */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // Fires once any part is 10% up into the screen, however tall the section is on a phone.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} data-shown={shown ? "" : undefined} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
