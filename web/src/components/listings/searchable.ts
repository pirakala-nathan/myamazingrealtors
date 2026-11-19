import { isOverAsking } from "@/components/listings/status-badge";
import { toFilterable, type Filterable } from "@/lib/listings/filters";
import { statusLabel, type Listing } from "@/lib/listings/types";

/** What the search panel needs to show live results in the browser (no sold prices). */
export type SearchableListing = Filterable & {
  key: string;
  href: string;
  src: string | null;
  title: string;
  place: string;
  status: string;
  over: boolean;
};

export function searchableListings(all: Listing[]): SearchableListing[] {
  return [...all]
    .filter((l) => l.status !== "off-market")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((l) => {
      const over = isOverAsking(l);
      return {
        ...toFilterable(l),
        key: l.mlsNumber,
        href: `/listings/${l.slug}`,
        src: l.photos[0] ?? null,
        title: l.street ?? l.city,
        place: [l.city, l.propertyType].filter(Boolean).join(" · "),
        status: over ? "Over asking" : statusLabel[l.status],
        over,
      };
    });
}
