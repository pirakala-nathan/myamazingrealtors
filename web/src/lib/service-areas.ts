import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { MAP_AREAS } from "@/lib/content/service-areas-map";
import { getListings } from "@/lib/listings/store";
import { isPastDeal } from "@/lib/listings/types";

export const SERVICE_AREA_TAG = "service-areas";

export type AreaStats = {
  id: string;
  /** Active residential listings for sale on TRREB MLS®, or null when the IDX feed isn't reachable. */
  forSale: number | null;
  /** PK's closed deals in the area: sold, leased or purchased. */
  deals: number;
  /** PK's own listings for sale in the area right now. */
  active: number;
};

const SCARBOROUGH = ["E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11"];
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const city = (name: string) => `City eq ${q(name)}`;
const scarborough = SCARBOROUGH.map((d) => city(`Toronto ${d}`)).join(" or ");

/** IDX filter for each area. Toronto is counted city-wide, then Scarborough is taken off. */
const FILTERS: Record<string, string> = {
  oshawa: city("Oshawa"),
  whitby: city("Whitby"),
  ajax: city("Ajax"),
  pickering: city("Pickering"),
  clarington: city("Clarington"),
  scarborough,
  markham: city("Markham"),
  toronto: "CountyOrParish eq 'Toronto'",
  "richmond-hill": city("Richmond Hill"),
  stouffville: city("Whitchurch-Stouffville"),
  uxbridge: city("Uxbridge"),
};

const FOR_SALE =
  "StandardStatus eq 'Active' and TransactionType eq 'For Sale' and " +
  "(PropertyType eq 'Residential Freehold' or PropertyType eq 'Residential Condo & Other')";

async function countForSale(filter: string, token: string): Promise<number | null> {
  const url = `https://query.ampre.ca/odata/Property?$top=0&$count=true&$filter=${encodeURIComponent(`${FOR_SALE} and (${filter})`)}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const count = ((await res.json()) as { "@odata.count"?: unknown })["@odata.count"];
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

/** Which service area a listing's city belongs to (PropTx gives "Toronto E09"; hand-entered ones say "Scarborough"). */
export function areaForCity(raw: string): string | null {
  const c = raw.trim().toLowerCase();
  const district = /^toronto\s+(e\d{2})/.exec(c)?.[1]?.toUpperCase();
  if (c.startsWith("scarborough") || (district && SCARBOROUGH.includes(district))) return "scarborough";
  if (c.startsWith("toronto") || ["north york", "etobicoke", "east york", "york"].includes(c)) return "toronto";
  if (c.includes("stouffville")) return "stouffville";
  if (["courtice", "bowmanville", "newcastle"].some((t) => c.startsWith(t))) return "clarington";
  return MAP_AREAS.find((a) => a.name.toLowerCase() === c)?.id ?? null;
}

/** Homes for sale (hourly, from PK's IDX feed) and PK's own deals, per service area. */
export async function getServiceAreaStats(): Promise<AreaStats[]> {
  "use cache";
  cacheTag(SERVICE_AREA_TAG);
  cacheLife({ stale: 900, revalidate: 3600, expire: 24 * 3600 });

  const token = process.env.PROPTX_IDX_TOKEN;
  const counts = new Map<string, number | null>();
  if (token) {
    const entries = await Promise.all(
      Object.entries(FILTERS).map(async ([id, f]) => [id, await countForSale(f, token)] as const),
    );
    for (const [id, n] of entries) counts.set(id, n);
    const toronto = counts.get("toronto");
    const scar = counts.get("scarborough");
    counts.set("toronto", toronto != null && scar != null ? Math.max(0, toronto - scar) : null);
  }

  const listings = (await getListings()).filter((l) => l.status !== "off-market");
  return MAP_AREAS.map(({ id }) => {
    const here = listings.filter((l) => areaForCity(l.city) === id);
    return {
      id,
      forSale: counts.get(id) ?? null,
      deals: here.filter((l) => isPastDeal(l.status)).length,
      active: here.filter((l) => l.status === "active" || l.status === "pending").length,
    };
  });
}
