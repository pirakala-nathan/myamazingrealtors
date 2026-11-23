"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MapArea } from "@/lib/content/service-areas-map";

export type AreaView = MapArea & { forSale: number | null; deals: number; active: number };

/** The order the outlines draw in: east to west, from Durham through York and Toronto to Peel. */
const DRAW_ORDER = [
  "clarington", "oshawa", "whitby", "ajax", "pickering", "uxbridge",
  "scarborough", "markham", "stouffville", "richmond-hill", "toronto",
  "vaughan", "brampton", "mississauga",
];
const STEP_MS = 140;

const fmt = (n: number) => n.toLocaleString("en-CA");

/** Counts up to `value` whenever it changes (eased, 700 ms). Reduced motion shows the number straight away. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = duration ? Math.min(1, (t - start) / duration) : 1;
      const v = Math.round(a + (value - a) * (1 - (1 - k) ** 3));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(shown)}</>;
}

/**
 * The service-area map: real municipal outlines that draw themselves in when the section scrolls into
 * view, then fill and label. Hovering (or tapping, or using the area buttons) lights an area up, dims
 * the rest and shows its live numbers in the card.
 */
export function ServiceAreaMap({
  areas,
  context,
  viewBox,
}: {
  areas: AreaView[];
  context: string[];
  viewBox: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const current = areas.find((a) => a.id === (hovered ?? pinned)) ?? null;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const totalForSale = areas.every((a) => a.forSale != null)
    ? areas.reduce((s, a) => s + (a.forSale ?? 0), 0)
    : null;
  const totalDeals = areas.reduce((s, a) => s + a.deals, 0);
  const lastDrawn = DRAW_ORDER.length * STEP_MS;

  return (
    <div
      ref={rootRef}
      className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-center lg:gap-12"
    >
      <div>
        <svg
          viewBox={viewBox}
          aria-hidden="true"
          data-drawn={drawn}
          data-focus={current ? "" : undefined}
          className="service-map w-full"
          onMouseLeave={() => setHovered(null)}
        >
          {context.map((d, i) => (
            <path key={i} d={d} className="service-map-context" />
          ))}
          {areas.map((a) => (
            <path
              key={a.id}
              d={a.d}
              pathLength={1}
              className="service-map-area"
              data-on={current?.id === a.id || undefined}
              style={{ "--delay": `${DRAW_ORDER.indexOf(a.id) * STEP_MS}ms` } as React.CSSProperties}
              onMouseEnter={() => setHovered(a.id)}
              onClick={() => setPinned((p) => (p === a.id ? null : a.id))}
            />
          ))}
          {areas.map((a) => (
            <text
              key={a.id}
              x={a.label[0]}
              y={a.label[1]}
              textAnchor="middle"
              className="service-map-label"
              data-on={current?.id === a.id || undefined}
              style={{ "--delay": `${DRAW_ORDER.indexOf(a.id) * STEP_MS + 600}ms` } as React.CSSProperties}
            >
              {a.name}
            </text>
          ))}
          {/* A pulsing pin wherever PK has closed a deal or has a home for sale. */}
          {areas
            .filter((a) => a.deals + a.active > 0)
            .map((a, i) => (
              <g
                key={a.id}
                className="service-map-pin"
                style={{ "--delay": `${lastDrawn + 500 + i * 120}ms` } as React.CSSProperties}
              >
                <circle cx={a.label[0]} cy={a.label[1] + 16} r="5" className="service-map-pin-ring" />
                <circle cx={a.label[0]} cy={a.label[1] + 16} r="5" className="fill-on-dark" />
              </g>
            ))}
          <text x="560" y="805" className="service-map-water">
            LAKE ONTARIO
          </text>
        </svg>

        {/* The same areas as buttons: easier on phones, and how keyboard and screen-reader users explore. */}
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Service areas">
          {areas
            .slice()
            .sort((a, b) => DRAW_ORDER.indexOf(a.id) - DRAW_ORDER.indexOf(b.id))
            .map((a) => {
              const on = current?.id === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={pinned === a.id}
                    onClick={() => setPinned((p) => (p === a.id ? null : a.id))}
                    onMouseEnter={() => setHovered(a.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`border px-3 py-1.5 text-[13px] font-bold transition-colors ${
                      on
                        ? "border-aqua-400 bg-aqua-400 text-navy-900"
                        : "border-navy-600 text-on-dark hover:border-aqua-400"
                    }`}
                  >
                    {a.name}
                  </button>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="relative border border-navy-600 bg-navy-950/40 p-6 sm:p-8" aria-live="polite">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-aqua-400" aria-hidden="true" />
        <p className="eyebrow text-aqua-400">{current ? "Service area" : "Where PK works"}</p>
        <h3 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.75rem)] font-semibold leading-none">
          {current?.name ?? "Durham & the GTA"}
        </h3>
        <dl className="mt-7 grid grid-cols-2 gap-6">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-on-dark-muted">
              {current ? "homes for sale now" : "homes for sale across these areas"}
            </dt>
            <dd className="font-display text-5xl font-semibold [font-variant-numeric:lining-nums_tabular-nums] text-on-dark">
              {(current ? current.forSale : totalForSale) == null ? (
                "—"
              ) : (
                <CountUp value={(current ? current.forSale : totalForSale) ?? 0} />
              )}
            </dd>
          </div>
          {current && !current.deals ? (
            // No closed deals here yet: say PK serves it rather than show a zero.
            <div className="self-end">
              <dt className="sr-only">PK in {current.name}</dt>
              <dd className="flex flex-col gap-2 text-sm text-on-dark-muted">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-aqua-400" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                PK works with buyers and sellers here
              </dd>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-on-dark-muted">
                {current ? `home${current.deals === 1 ? "" : "s"} PK has sold, leased or bought here` : "areas PK covers"}
              </dt>
              <dd className="font-display text-5xl font-semibold [font-variant-numeric:lining-nums_tabular-nums] text-aqua-400">
                <CountUp value={current ? current.deals : areas.length} />
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-col gap-3 border-t border-navy-600 pt-5 text-[15px] font-extrabold">
          {current ? (
            <>
              {current.deals + current.active > 0 && (
                <Link href="/our-listings" className="text-aqua-300 hover:text-on-dark">
                  See PK’s homes in {current.name} →
                </Link>
              )}
              <Link href="/contact" className="text-aqua-300 hover:text-on-dark">
                Talk to PK about {current.name} →
              </Link>
            </>
          ) : (
            <p className="font-normal text-on-dark-muted">
              {totalDeals > 0 ? `${totalDeals} homes sold, leased or bought with PK. ` : ""}
              Hover over an area, or pick one below the map, to see its numbers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
