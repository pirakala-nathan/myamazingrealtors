"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export type SearchableListing = {
  key: string;
  href: string;
  src: string | null;
  title: string;
  place: string;
  status: string;
  over: boolean;
  /** Lower-case street, city, postal code, MLS® number and property type (same fields as /our-listings). */
  haystack: string;
};

const MAX_RESULTS = 4;
const isRemote = (src: string) => /^https?:\/\//.test(src);

/** Same rule as the listings page: every word typed must appear somewhere in the listing. */
const matches = (l: SearchableListing, q: string) =>
  q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => l.haystack.includes(word));

/**
 * Types and deletes example searches in the empty box ("Pickering", "an MLS® number", …), the way a
 * person would. Stops while the visitor is typing and for reduced-motion visitors.
 */
function useTypingHint(examples: string[], active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let example = 0;
    let length = 0;
    let deleting = false;
    let timer = 0;
    const step = () => {
      const word = examples[example];
      if (!deleting) {
        length += 1;
        setText(word.slice(0, length));
        if (length === word.length) {
          deleting = true;
          timer = window.setTimeout(step, 1600); // hold the full word
          return;
        }
        timer = window.setTimeout(step, 75 + Math.random() * 60);
      } else {
        length -= 1;
        setText(word.slice(0, length));
        if (length === 0) {
          deleting = false;
          example = (example + 1) % examples.length;
          timer = window.setTimeout(step, 350);
          return;
        }
        timer = window.setTimeout(step, 35);
      }
    };
    timer = window.setTimeout(step, 900);
    return () => window.clearTimeout(timer);
  }, [examples, active]);
  return text;
}

/**
 * Hero search: an animated hint types example searches; as the visitor types, matching listings drop
 * down as photo cards (arrow keys + Enter work). Enter or "Search" opens the full results on /our-listings.
 * City shortcuts slide in underneath.
 */
export function HeroSearch({
  listings,
  cities,
  firstName,
  counts,
}: {
  listings: SearchableListing[];
  cities: readonly string[];
  firstName: string;
  counts: { forSale: number; sold: number };
}) {
  const router = useRouter();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [examples] = useState(() => [cities[0], cities[1], "a street name", "an MLS® number", cities[2]]);
  const hint = useTypingHint(examples, !focused && query === "");

  const q = query.trim();
  const results = q ? listings.filter((l) => matches(l, q)).slice(0, MAX_RESULTS) : [];
  const total = q ? listings.filter((l) => matches(l, q)).length : 0;
  const open = focused && q.length > 0;

  // Close the results when clicking anywhere else.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const searchAll = () => router.push(q ? `/our-listings?q=${encodeURIComponent(q)}` : "/our-listings");

  return (
    <div ref={rootRef} className="relative flex max-w-[560px] flex-col gap-4">
      <form
        role="search"
        action="/our-listings"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          if (open && highlight >= 0 && results[highlight]) router.push(results[highlight].href);
          else searchAll();
        }}
        className="hero-rise group relative flex bg-white shadow-[0_18px_44px_-22px_rgba(10,29,40,0.5)] transition-shadow focus-within:shadow-[0_22px_50px_-20px_rgba(0,178,219,0.55)]"
        style={{ animationDelay: "var(--hero-delay, 0ms)" }}
      >
        {/* Cyan line that sweeps across the top as the bar arrives, and glows while it's in use. */}
        <span
          aria-hidden="true"
          className="hero-sweep absolute inset-x-0 top-0 h-[3px] bg-aqua-400"
          style={{ animationDelay: "calc(var(--hero-delay, 0ms) + 350ms)" }}
        />
        <label htmlFor={`${id}-q`} className="sr-only">
          Search {firstName}’s listings by city, street or MLS® number
        </label>
        <span className="relative flex min-w-0 flex-1 items-center">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="pointer-events-none absolute left-4 text-muted transition-colors group-focus-within:text-aqua-700"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            id={`${id}-q`}
            name="q"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(-1);
            }}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => (h + 1) % results.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => (h <= 0 ? results.length - 1 : h - 1));
              } else if (e.key === "Escape") {
                setFocused(false);
              }
            }}
            placeholder={focused ? "City, street or MLS®#" : ""}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-results`}
            aria-autocomplete="list"
            aria-activedescendant={open && highlight >= 0 ? `${id}-r${highlight}` : undefined}
            className="min-h-16 w-full min-w-0 rounded-none bg-transparent pl-12 pr-3 text-base text-ink placeholder:text-muted focus:outline-none sm:text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          {/* The typing hint, drawn over the empty box. */}
          {!focused && query === "" && (
            <span aria-hidden="true" className="pointer-events-none absolute left-12 right-3 truncate text-base text-muted sm:text-lg">
              Search {hint}
              <span className="hero-caret ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-aqua-500" />
            </span>
          )}
        </span>
        <button
          type="submit"
          className="m-1.5 shrink-0 rounded-none bg-navy-900 px-5 font-extrabold text-on-dark transition-colors hover:bg-aqua-400 hover:text-navy-900 sm:px-8"
        >
          Search
        </button>
      </form>

      {/* Live results under the box. */}
      <div
        id={`${id}-results`}
        role="listbox"
        aria-label="Matching listings"
        className={`absolute inset-x-0 top-[calc(4rem+0.5rem)] z-30 origin-top bg-white shadow-[0_28px_60px_-24px_rgba(10,29,40,0.55)] transition-[opacity,transform] duration-300 ease-out ${
          open ? "translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-2 scale-y-95 opacity-0"
        }`}
      >
        {open && (
          <>
            {results.length > 0 ? (
              <ul className="flex flex-col py-2">
                {results.map((l, i) => (
                  <li key={l.key} id={`${id}-r${i}`} role="option" aria-selected={i === highlight}>
                    <Link
                      href={l.href}
                      onMouseEnter={() => setHighlight(i)}
                      className={`hero-result flex items-center gap-4 px-3 py-2.5 transition-colors ${
                        i === highlight ? "bg-mist-100" : ""
                      }`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden bg-cloud-300">
                        {l.src && (
                          <Image src={l.src} alt="" fill sizes="80px" unoptimized={isRemote(l.src)} className="object-cover" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-bold text-ink">{l.title}</span>
                        <span className="truncate text-sm text-muted">{l.place}</span>
                      </span>
                      <span
                        className={`ml-auto shrink-0 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${
                          l.over ? "bg-navy-900 text-aqua-300" : "bg-aqua-100 text-navy-900"
                        }`}
                      >
                        {l.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hero-result px-5 py-4 text-sm text-body">
                No listings match “{q}” right now.{" "}
                <Link href="/contact" className="font-bold text-aqua-700 underline">
                  Ask {firstName} to send new ones
                </Link>
                .
              </p>
            )}
            <button
              type="button"
              onClick={searchAll}
              className="flex w-full items-center justify-between border-t border-cloud-300 px-5 py-3.5 text-left text-sm font-extrabold text-aqua-700 hover:bg-mist-100 hover:text-navy-900"
            >
              {total > MAX_RESULTS ? `See all ${total} results for “${q}”` : `Search all listings for “${q}”`}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Browse by city">
        {cities.map((city, i) => (
          <Link
            key={city}
            href={`/our-listings?q=${encodeURIComponent(city)}`}
            className="hero-rise border border-cloud-400 bg-white/70 px-3 py-1.5 text-sm font-semibold text-body transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-navy-900 hover:text-ink"
            style={{ animationDelay: `calc(var(--hero-delay, 0ms) + ${450 + i * 70}ms)` }}
          >
            {city}
          </Link>
        ))}
      </div>

      <p
        className="hero-rise flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body"
        style={{ animationDelay: `calc(var(--hero-delay, 0ms) + ${450 + cities.length * 70}ms)` }}
      >
        {counts.forSale + counts.sold > 0 && (
          <span>
            <strong className="text-ink">{counts.forSale}</strong> for sale · <strong className="text-ink">{counts.sold}</strong>{" "}
            recently sold
          </span>
        )}
        <Link href="/our-listings" className="font-extrabold text-aqua-700 hover:text-navy-900">
          Explore all listings →
        </Link>
      </p>
    </div>
  );
}
