"use client";

import { useEffect, useRef, useState } from "react";

export type Stat = { value: string; label: string; detail: string; more: string };

const DURATION_MS = 1600;

/** Splits "$75M+" into "$", 75, "M+" so the number can count up; placeholders like "[##]" don't animate. */
function parse(value: string) {
  const m = value.match(/^([^0-9[]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  return { prefix: m[1], number: Number(m[2]), decimals: m[2].includes(".") ? m[2].split(".")[1].length : 0, suffix: m[3] };
}

/** Counts from 0 to the value with an ease-out, every time `run` turns on. */
function CountUp({ value, run, delay, visible }: { value: string; run: number; delay: number; visible: boolean }) {
  const parsed = parse(value);
  const [shown, setShown] = useState(parsed ? 0 : null);

  useEffect(() => {
    if (!parsed || run === 0) return;
    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setShown(parsed.number));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(parsed.number * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when a new run begins
  }, [run]);

  // Back to 0 once the band is off screen, so the next visit counts up cleanly instead of jumping down.
  useEffect(() => {
    if (visible || !parsed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = requestAnimationFrame(() => setShown(0));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when visibility changes
  }, [visible]);

  if (!parsed || shown === null) return <>{value}</>;
  return (
    <>
      {/* Screen readers get the final value straight away. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {parsed.prefix}
        {shown.toFixed(parsed.decimals)}
        {parsed.suffix}
      </span>
    </>
  );
}

/**
 * Results band cards. The numbers count up each time the band scrolls into view.
 * Hovering a card lifts it, lights its border and reveals an extra line; touch screens show that line always.
 */
export function StatCards({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDListElement>(null);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setRun((r) => r + 1);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <dl ref={ref} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="group relative flex flex-col gap-2 overflow-hidden border border-navy-600 bg-navy-900 p-4 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-aqua-400 hover:shadow-[0_24px_50px_-24px_rgba(0,178,219,0.6)] sm:p-7 lg:min-h-45"
        >
          {/* Cyan line that draws across the top on hover. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-aqua-400 transition-transform duration-500 ease-out group-hover:scale-x-100"
          />
          <dt className="text-sm font-bold sm:text-[17px]">{s.label}</dt>
          <dd className="order-first font-display text-4xl font-bold leading-none text-aqua-400 tabular-nums transition-colors group-hover:text-aqua-300 sm:text-[54px]">
            <CountUp value={s.value} run={run} delay={i * 120} visible={visible} />
          </dd>
          <dd className="hidden text-sm text-on-dark-subtle sm:block">{s.detail}</dd>
          {/* Extra line: opens on hover; always open on touch screens, which can't hover. */}
          <dd className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] pointer-coarse:grid-rows-[1fr]">
            <span className="overflow-hidden text-[13px] leading-relaxed text-on-dark-muted opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-coarse:opacity-100 sm:text-sm">
              <span className="block pt-1">{s.more}</span>
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
