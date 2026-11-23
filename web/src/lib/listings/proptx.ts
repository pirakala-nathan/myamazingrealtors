import "server-only";
import type { Listing, ListingStatus } from "./types";

/**
 * PropTx (TRREB) RESO Web API, served by AMP Syndication.
 * Docs: https://developer.ampre.ca  ·  Base: https://query.ampre.ca/odata/
 * Access token: https://syndication.ampre.ca/tokens (shown once; store it in PROPTX_TOKEN).
 *
 * PROPTX_TOKEN is PK's DLA (data licence agreement) token. It covers RE/MAX Community Realty's listings,
 * including closed ones (sold/leased), so lookups outside the brokerage come back empty.
 * (PK also has an IDX token for all active TRREB listings; it's for a future full home search.)
 *
 * Field names checked against the live feed on 2026-11-19: every field read below exists except
 * Latitude/Longitude (absent, so those stay null). The feed has no sale price, so "sold over asking"
 * is PK's own mark. Photos come in several sizes; "Large" is 1080 px on the short side (~170 KB).
 * Agent names are not unique (another agent shares PK's surname), so listings are only ever added by
 * MLS® number, never matched by name.
 */
const BASE = "https://query.ampre.ca/odata";

export const MLS_PATTERN = /^[A-Z]{1,4}\d{5,10}$/;

export class LookupError extends Error {}

type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function query(path: string, token: string): Promise<Raw[]> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401 || res.status === 403) {
    throw new LookupError("PropTx rejected the access token. Check PROPTX_TOKEN, or regenerate it in the PropTx portal.");
  }
  if (res.status === 429) throw new LookupError("PropTx is rate-limiting requests. Try again in a minute.");
  if (!res.ok) throw new LookupError(`PropTx returned an error (${res.status}). Try again shortly.`);
  const body = (await res.json()) as { value?: Raw[] };
  return body.value ?? [];
}

function mapStatus(p: Raw): ListingStatus {
  const standard = str(p.StandardStatus)?.toLowerCase();
  const mls = str(p.MlsStatus)?.toLowerCase() ?? "";
  const lease = str(p.TransactionType)?.toLowerCase().includes("lease");
  if (standard === "closed" || mls === "sold" || mls === "leased") return lease ? "leased" : "sold";
  if (standard === "pending" || mls.startsWith("sold conditional")) return "pending";
  if (standard === "active" || standard === "active under contract" || mls === "new" || mls === "price change" || mls === "extension")
    return "active";
  return "off-market";
}

function street(p: Raw) {
  const parts = [str(p.StreetNumber), str(p.StreetName), str(p.StreetSuffix), str(p.StreetDirSuffix)].filter(Boolean);
  const unit = str(p.UnitNumber);
  const line = parts.length ? parts.join(" ") : str(p.UnparsedAddress)?.split(",")[0] ?? null;
  if (!line) return null;
  return unit ? `${unit} - ${line}` : line;
}

function bedrooms(p: Raw) {
  const above = num(p.BedroomsAboveGrade);
  const below = num(p.BedroomsBelowGrade);
  const total = num(p.BedroomsTotal);
  if (above != null) return below ? `${above} + ${below}` : String(above);
  return total != null ? String(total) : null;
}

export function slugFor(streetLine: string | null, city: string, mls: string) {
  return [streetLine ?? "listing", city, mls]
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function photos(mls: string, token: string) {
  const media = await query(
    `Media?$filter=ResourceRecordKey eq '${mls}' and ResourceName eq 'Property' and ImageSizeDescription eq 'Large'&$top=100`,
    token,
  );
  return media
    .filter((m) => {
      const type = str(m.MediaType) ?? "";
      const category = str(m.MediaCategory);
      return str(m.MediaURL) && (type.startsWith("image") || category === "Photo") && m.MediaStatus !== "Deleted";
    })
    .sort((a, b) => {
      if (a.PreferredPhotoYN === true) return -1;
      if (b.PreferredPhotoYN === true) return 1;
      return (num(a.Order) ?? 999) - (num(b.Order) ?? 999);
    })
    .map((m) => str(m.MediaURL)!)
    .slice(0, 40);
}

/** Looks up one listing by MLS® number. Returns null when the feed has no such listing. */
export async function lookupListing(mlsNumber: string, token: string): Promise<Omit<Listing, "addedAt"> | null> {
  if (!MLS_PATTERN.test(mlsNumber)) throw new LookupError("That doesn’t look like an MLS® number (for example E12345678).");

  const [p] = await query(`Property?$filter=ListingKey eq '${mlsNumber}'&$top=1`, token);
  if (!p) return null;

  // Sellers can opt out of internet display; respect both flags.
  if (p.InternetEntireListingDisplayYN === false) {
    throw new LookupError("The seller has asked that this listing not be shown online, so it can’t be added.");
  }
  const showAddress = p.InternetAddressDisplayYN !== false;
  const streetLine = showAddress ? street(p) : null;
  const city = str(p.City) ?? "";

  return {
    mlsNumber,
    slug: slugFor(streetLine, city, mlsNumber),
    status: mapStatus(p),
    transactionType: str(p.TransactionType) ?? "For Sale",
    listPrice: num(p.ListPrice),
    street: streetLine,
    city,
    province: str(p.StateOrProvince) ?? "ON",
    postalCode: showAddress ? str(p.PostalCode) : null,
    bedrooms: bedrooms(p),
    bathrooms: num(p.BathroomsTotalInteger),
    propertyType: str(p.PropertySubType) ?? str(p.PropertyType),
    sizeRange: str(p.LivingAreaRange),
    description: str(p.PublicRemarks),
    listOffice: str(p.ListOfficeName),
    photos: await photos(mlsNumber, token),
    latitude: showAddress ? num(p.Latitude) : null,
    longitude: showAddress ? num(p.Longitude) : null,
    source: "proptx",
    fetchedAt: new Date().toISOString(),
    modifiedAt: str(p.ModificationTimestamp),
  };
}

/**
 * MLS® numbers of every listing in the feed where the agent is the listing agent or a co-listing agent,
 * with when each last changed. Matched only by member ID, never by name.
 */
export async function agentListingKeys(memberId: string, token: string) {
  if (!/^\d{4,10}$/.test(memberId)) throw new LookupError("The agent member ID isn’t valid.");
  const filter = ["ListAgentKey", "CoListAgentKey", "CoListAgent3Key", "CoListAgent4Key"]
    .map((field) => `${field} eq '${memberId}'`)
    .join(" or ");
  const rows = await query(
    `Property?$filter=${encodeURIComponent(filter)}&$select=ListingKey,ModificationTimestamp&$top=500`,
    token,
  );
  return rows
    .map((r) => ({ mlsNumber: str(r.ListingKey), modifiedAt: str(r.ModificationTimestamp) }))
    .filter((r): r is { mlsNumber: string; modifiedAt: string | null } => r.mlsNumber != null && MLS_PATTERN.test(r.mlsNumber));
}

/**
 * Development only, used when PROPTX_TOKEN isn't set: a clearly labelled sample
 * built from photos already in /public, so the admin and listing pages can be tried.
 */
export function sampleListing(mlsNumber: string): Omit<Listing, "addedAt"> {
  const street = "27 Sample Crescent";
  return {
    mlsNumber,
    slug: slugFor(street, "Ajax", mlsNumber),
    status: "active",
    transactionType: "For Sale",
    listPrice: 1_049_900,
    street,
    city: "Ajax",
    province: "ON",
    postalCode: null,
    bedrooms: "4 + 1",
    bathrooms: 4,
    propertyType: "Detached",
    sizeRange: "2000-2500",
    description:
      "SAMPLE LISTING FOR TESTING (no PropTx token set). This text stands in for the MLS® public remarks that PropTx returns.",
    listOffice: "RE/MAX Community Realty Inc.",
    photos: [
      "/images/listings/27-aldgate-crescent.jpg",
      "/images/listings/81-butson-crescent-kitchen.jpg",
      "/images/listings/38-soldier-crescent.jpg",
    ],
    latitude: null,
    longitude: null,
    source: "dev-sample",
    fetchedAt: new Date().toISOString(),
    modifiedAt: null,
  };
}
