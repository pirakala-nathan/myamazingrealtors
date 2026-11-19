"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BED_OPTIONS,
  PRICE_RANGES,
  SHOW_OPTIONS,
  filtersHref,
  matchesFilters,
  type ListingFilters,
} from "@/lib/listings/filters";
import type { SearchableListing } from "./searchable";

const MAX_RESULTS = 4;
const isRemote = (src: string) => /^https?:\/\//.test(src);

/** Types and deletes example searches in the empty location box, the way a person would. */
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
      length += deleting ? -1 : 1;
      setText(word.slice(0, length));
      if (!deleting && length === word.length) {
        deleting = true;
        timer = window.setTimeout(step, 1600);
      } else if (deleting && length === 0) {
        deleting = false;
        example = (example + 1) % examples.length;
        timer = window.setTimeout(step, 350);
      } else {
        timer = window.setTimeout(step, deleting ? 35 : 75 + Math.random() * 60);
      }
    };
    timer = window.setTimeout(step, 900);
    return () => window.clearTimeout(timer);
  }, [examples, active]);
  return text;
}

const icons = {
  pin: <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  home: <path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5" />,
  tag: <path d="M3.5 12.5V4.5h8l9 9-8 8-9-9Zm4.5-4a1 1 0 1 0 0 .01" />,
  bed: <path d="M3 18v-9m0 5h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5M7 12.5a1.5 1.5 0 1 0 0-.01" />,
};

function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-aqua-700"
    >
      {icons[name]}
    </svg>
  );
}

/** One labelled segment of the panel (icon, small caps label, control), divided from the next. */
function Segment({
  icon,
  label,
  htmlFor,
  children,
  after,
  className = "",
}: {
  icon: keyof typeof icons;
  label: string;
  htmlFor: string;
  children: ReactNode;
  /** Rendered after the field, positioned against the segment (e.g. a dropdown). */
  after?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex min-w-0 items-center gap-3 border-b border-cloud-300 px-4 py-3 transition-colors focus-within:bg-mist-50 lg:border-b-0 lg:border-r ${className}`}
    >
      <Icon name={icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={htmlFor} className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
        {children}
      </div>
      {after}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <span className="relative flex">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent py-0.5 pr-6 text-[15px] font-semibold text-ink focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-muted"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

/**
 * Listings search panel: tabs on top (all / for sale / sold), then labelled segments for location,
 * property type, price and beds, and a Search button. Typing a location drops down matching listings
 * as photo cards (arrow keys + Enter work); Search opens /our-listings with the filters.
 * Used on the homepage and, prefilled, on the listings page.
 */
export function SearchPanel({
  listings,
  types,
  cities,
  locations,
  firstName,
  initial,
}: {
  listings: SearchableListing[];
  types: string[];
  cities: readonly string[];
  /** Cities to pick from in the Location dropdown (with how many listings each). */
  locations: { name: string; count: number }[];
  firstName: string;
  initial?: ListingFilters;
}) {
  const router = useRouter();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ListingFilters>(initial ?? { q: "", show: "", type: "", price: "", beds: "" });
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [examples] = useState(() => [cities[0], cities[1], "a street name", "an MLS® number", cities[2]]);
  const hint = useTypingHint(examples, !focused && filters.q === "");
  const set = (patch: Partial<ListingFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setHighlight(-1);
  };

  const q = filters.q.trim();
  const lower = q.toLowerCase();
  // Picking a location fills the box with the city; typing filters the cities and also shows matching homes.
  const pickedCity = locations.some((l) => l.name.toLowerCase() === lower);
  const cityOptions = pickedCity ? [] : locations.filter((l) => l.name.toLowerCase().includes(lower));
  const matching = q && !pickedCity ? listings.filter((l) => matchesFilters(l, { ...filters, q })) : [];
  const results = matching.slice(0, MAX_RESULTS);
  const options = [
    ...cityOptions.map((c) => ({ kind: "city" as const, city: c })),
    ...results.map((l) => ({ kind: "home" as const, home: l })),
  ];
  const open = focused && options.length + (q && !pickedCity ? 1 : 0) > 0;
  const pickCity = (name: string) => {
    set({ q: name });
    setFocused(false);
  };

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const searchAll = () => router.push(filtersHref({ ...filters, q }));
  const typeOptions = [{ value: "", label: "Any type" }, ...types.map((t) => ({ value: t, label: t }))];

  // Dropdown hanging under the Location field: locations to pick from, then matching homes.
  const dropdown = (
    <div
      id={`${id}-results`}
      role="listbox"
      aria-label="Locations and matching listings"
      className={`absolute -inset-x-px top-full z-30 mt-px max-h-[min(60vh,520px)] origin-top border border-cloud-300 lg:right-auto lg:w-[max(100%,420px)] overflow-y-auto bg-white shadow-[0_28px_60px_-24px_rgba(10,29,40,0.55)] transition-[opacity,transform] duration-300 ease-out ${
        open ? "translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-2 scale-y-95 opacity-0"
      }`}
    >
      {open && (
        <>
          {cityOptions.length > 0 && (
            <div className="py-2">
              <p className="px-5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Locations</p>
              <ul>
                {cityOptions.map((c, i) => (
                  <li key={c.name} id={`${id}-r${i}`} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onClick={() => pickCity(c.name)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`hero-result flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        i === highlight ? "bg-mist-100" : ""
                      }`}
                      style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                    >
                      <Icon name="pin" />
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="ml-auto text-sm text-muted">
                        {c.count > 0 ? `${c.count} listing${c.count === 1 ? "" : "s"}` : "Service area"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!q || pickedCity ? null : results.length > 0 ? (
            <ul className={`flex flex-col py-2 ${cityOptions.length ? "border-t border-cloud-300" : ""}`}>
              <li
                aria-hidden="true"
                className="px-5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                Homes
              </li>
              {results.map((l, n) => {
                const i = cityOptions.length + n;
                return (
                  <li key={l.key} id={`${id}-r${i}`} role="option" aria-selected={i === highlight}>
                    <Link
                      href={l.href}
                      onMouseEnter={() => setHighlight(i)}
                      className={`hero-result flex items-center gap-4 px-3 py-2.5 transition-colors ${i === highlight ? "bg-mist-100" : ""}`}
                      style={{ animationDelay: `${n * 60}ms` }}
                    >
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden bg-cloud-300">
                        {l.src && (
                          <Image
                            src={l.src}
                            alt=""
                            fill
                            sizes="80px"
                            unoptimized={isRemote(l.src)}
                            className="object-cover"
                          />
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
                );
              })}
            </ul>
          ) : cityOptions.length === 0 ? (
            <p className="hero-result px-5 py-4 text-sm text-body">
              No listings match that search right now.{" "}
              <Link href="/contact" className="font-bold text-aqua-700 underline">
                Ask {firstName} to send new ones
              </Link>
              .
            </p>
          ) : null}
          {q && !pickedCity && (
            <button
              type="button"
              onClick={searchAll}
              className="flex w-full items-center justify-between border-t border-cloud-300 px-5 py-3.5 text-left text-sm font-extrabold text-aqua-700 hover:bg-mist-100 hover:text-navy-900"
            >
              {matching.length > MAX_RESULTS ? `See all ${matching.length} results` : "Open the full search"}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className="hero-rise relative" style={{ animationDelay: "var(--hero-delay, 0ms)" }}>
      {/* Tabs sitting on top of the panel. */}
      <div className="flex items-end justify-between gap-4">
        {/* On narrow phones the tabs scroll sideways rather than squeezing. */}
        <div
          role="tablist"
          aria-label="Which listings"
          className="flex min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SHOW_OPTIONS.map((o) => {
            const selected = filters.show === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => set({ show: o.value })}
                className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-[13px] font-extrabold transition-colors sm:px-6 sm:text-sm ${
                  selected ? "bg-white text-ink" : "bg-navy-900/[0.06] text-body hover:bg-white/70 hover:text-ink"
                }`}
              >
                {selected && (
                  <span aria-hidden="true" className="hero-sweep absolute inset-x-0 top-0 h-[3px] bg-aqua-400" />
                )}
                {o.label}
              </button>
            );
          })}
        </div>
        <Link
          href="/home-evaluation"
          className="hidden pb-3 text-sm font-extrabold text-aqua-700 hover:text-navy-900 md:block"
        >
          Selling? See what your home is worth →
        </Link>
      </div>

      <form
        role="search"
        action="/our-listings"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          const option = open && highlight >= 0 ? options[highlight] : undefined;
          if (option?.kind === "city") pickCity(option.city.name);
          else if (option?.kind === "home") router.push(option.home.href);
          else searchAll();
        }}
        className="grid bg-white shadow-[0_24px_50px_-28px_rgba(10,29,40,0.55)] md:grid-cols-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]"
      >
        {filters.show && <input type="hidden" name="show" value={filters.show} />}

        <Segment
          icon="pin"
          label="Location"
          htmlFor={`${id}-q`}
          className="md:col-span-3 lg:col-span-1"
          after={dropdown}
        >
          <span className="relative flex">
            <input
              id={`${id}-q`}
              name="q"
              type="search"
              autoComplete="off"
              value={filters.q}
              onChange={(e) => {
                set({ q: e.target.value });
                setFocused(true);
              }}
              onFocus={() => setFocused(true)}
              onClick={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") return setFocused(false);
                if (e.key === "ArrowDown" && !focused) return setFocused(true);
                if (!open || options.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => (h + 1) % options.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => (h <= 0 ? options.length - 1 : h - 1));
                }
              }}
              placeholder={focused ? "Choose a city, or type a street or MLS®#" : ""}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-results`}
              aria-autocomplete="list"
              aria-activedescendant={open && highlight >= 0 ? `${id}-r${highlight}` : undefined}
              className="w-full min-w-0 bg-transparent py-0.5 pr-6 text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {/* Opens the list of locations. */}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Show locations"
              onClick={() => {
                setFocused((f) => !f);
                document.getElementById(`${id}-q`)?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center text-muted hover:text-ink"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
                className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {!focused && filters.q === "" && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 right-6 flex items-center truncate text-[15px] text-muted"
              >
                <span className="motion-reduce:hidden">
                  {hint}
                  <span className="hero-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-aqua-500" />
                </span>
                <span className="hidden motion-reduce:inline">City, street or MLS®#</span>
              </span>
            )}
          </span>
        </Segment>

        <Segment icon="home" label="Property type" htmlFor={`${id}-type`} className="md:border-r">
          <Select id={`${id}-type`} value={filters.type} onChange={(type) => set({ type })} options={typeOptions} />
        </Segment>
        <Segment icon="tag" label="Price range" htmlFor={`${id}-price`} className="md:border-r">
          <Select
            id={`${id}-price`}
            value={filters.price}
            onChange={(price) => set({ price })}
            options={PRICE_RANGES}
          />
        </Segment>
        <Segment icon="bed" label="Beds" htmlFor={`${id}-beds`}>
          <Select id={`${id}-beds`} value={filters.beds} onChange={(beds) => set({ beds })} options={BED_OPTIONS} />
        </Segment>

        <div className="p-2 md:col-span-3 lg:col-span-1">
          <button
            type="submit"
            className="flex h-full min-h-13 w-full items-center justify-center gap-2.5 bg-navy-900 px-7 font-extrabold text-on-dark transition-colors hover:bg-aqua-400 hover:text-navy-900"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
