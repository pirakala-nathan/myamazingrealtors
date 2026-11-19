import { isPastDeal, type Listing } from "@/lib/listings/types";

/**
 * Listing search filters, shared by the homepage search panel (live results in the browser)
 * and /our-listings (the full results). URL: /our-listings?show=for-sale&q=pickering&type=Detached&price=0-750000&beds=3
 *
 * Prices: only homes for sale carry a price here. Sold prices aren't shown publicly, so sold homes never
 * match a price filter and their prices are never sent to the browser.
 */

export const SHOW_OPTIONS = [
  { value: "", label: "All listings" },
  { value: "for-sale", label: "For sale" },
  { value: "sold", label: "Recent sales" },
] as const;

export const PRICE_RANGES = [
  { value: "", label: "Any price" },
  { value: "0-750000", label: "Under $750K" },
  { value: "750000-1000000", label: "$750K – $1M" },
  { value: "1000000-1500000", label: "$1M – $1.5M" },
  { value: "1500000-", label: "$1.5M and up" },
] as const;

export const BED_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+ beds" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
  { value: "5", label: "5+ beds" },
] as const;

/** Bedrooms as published ("3 + 1") counted in total (4); null when unknown. */
export function bedroomCount(bedrooms: string | null) {
  const numbers = (bedrooms ?? "").match(/\d+/g);
  return numbers ? numbers.reduce((sum, n) => sum + Number(n), 0) : null;
}

/** Shown in the type menu until PK's own listings provide their property types. */
export const DEFAULT_TYPES = ["Detached", "Semi-Detached", "Townhouse", "Condo"];

export type ListingFilters = { q: string; show: "" | "for-sale" | "sold"; type: string; price: string; beds: string };

export type Filterable = {
  group: "for-sale" | "sold" | "other";
  type: string | null;
  beds: number | null;
  /** Asking price, for homes for sale only. */
  price: number | null;
  /** Lower-case street, city, postal code, MLS® number and property type. */
  haystack: string;
};

export const EMPTY_FILTERS: ListingFilters = { q: "", show: "", type: "", price: "", beds: "" };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "").trim();

export function parseFilters(params: Record<string, string | string[] | undefined>): ListingFilters {
  const show = one(params.show);
  const price = one(params.price);
  const beds = one(params.beds);
  return {
    q: one(params.q).slice(0, 80),
    show: show === "for-sale" || show === "sold" ? show : "",
    type: one(params.type).slice(0, 60),
    price: PRICE_RANGES.some((r) => r.value === price) ? price : "",
    beds: BED_OPTIONS.some((r) => r.value === beds) ? beds : "",
  };
}

export const hasFilters = (f: ListingFilters) => Boolean(f.q || f.show || f.type || f.price || f.beds);

export function toFilterable(l: Listing): Filterable {
  const group = l.status === "active" || l.status === "pending" ? "for-sale" : isPastDeal(l.status) ? "sold" : "other";
  return {
    group,
    type: l.propertyType,
    beds: bedroomCount(l.bedrooms),
    price: group === "for-sale" ? l.listPrice : null,
    haystack: [l.street, l.city, l.postalCode, l.mlsNumber, l.propertyType].filter(Boolean).join(" ").toLowerCase(),
  };
}

export function matchesFilters(l: Filterable, f: ListingFilters) {
  if (f.show && l.group !== f.show) return false;
  if (f.type && (l.type ?? "").toLowerCase() !== f.type.toLowerCase()) return false;
  if (f.beds && (l.beds == null || l.beds < Number(f.beds))) return false;
  if (f.price) {
    if (l.price == null) return false;
    const [min, max] = f.price.split("-").map((n) => (n ? Number(n) : null));
    if (min != null && l.price < min) return false;
    if (max != null && l.price >= max) return false;
  }
  // Every word typed must appear somewhere in the listing.
  return f.q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => l.haystack.includes(word));
}

/** Property types for the menu: the ones in PK's listings, or common ones until there are any. */
export function typeOptions(listings: Pick<Listing, "propertyType">[]) {
  const found = [...new Set(listings.map((l) => l.propertyType).filter((t): t is string => Boolean(t)))].sort();
  return found.length ? found : DEFAULT_TYPES;
}

/**
 * Locations for the Location dropdown: the cities in PK's listings (with how many homes each),
 * then PK's other service areas, so the menu is useful even before there are many listings.
 */
export function locationOptions(listings: Pick<Listing, "city" | "status">[], serviceAreas: readonly string[]) {
  const counts = new Map<string, number>();
  for (const l of listings) {
    if (l.status === "off-market" || !l.city) continue;
    counts.set(l.city, (counts.get(l.city) ?? 0) + 1);
  }
  const withListings = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  const known = new Set(withListings.map((l) => l.name.toLowerCase()));
  const others = serviceAreas.filter((a) => !known.has(a.toLowerCase())).map((name) => ({ name, count: 0 }));
  return [...withListings, ...others];
}

/** "for sale · Detached · Under $750K · “pickering”" for the results summary. */
export function describeFilters(f: ListingFilters) {
  return [
    f.show && SHOW_OPTIONS.find((o) => o.value === f.show)?.label.toLowerCase(),
    f.type,
    f.price && PRICE_RANGES.find((o) => o.value === f.price)?.label,
    f.beds && `${f.beds}+ beds`,
    f.q && `“${f.q}”`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Builds the /our-listings URL for a set of filters (empty ones left out). */
export function filtersHref(f: ListingFilters) {
  const params = new URLSearchParams();
  if (f.show) params.set("show", f.show);
  if (f.q) params.set("q", f.q);
  if (f.type) params.set("type", f.type);
  if (f.price) params.set("price", f.price);
  if (f.beds) params.set("beds", f.beds);
  const query = params.toString();
  return query ? `/our-listings?${query}` : "/our-listings";
}
