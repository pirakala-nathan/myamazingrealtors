/** A listing PK has added to the site, stored in Firestore under its MLS® number. */
/** purchased: PK represented the buyer on another brokerage's listing (always entered by hand). */
export type ListingStatus = "active" | "pending" | "sold" | "leased" | "purchased" | "off-market";

/** Completed deals: sold or leased (PK's listings) and purchased (PK's buyers). */
export const isPastDeal = (status: ListingStatus) => status === "sold" || status === "leased" || status === "purchased";

export type Listing = {
  mlsNumber: string;
  slug: string;
  status: ListingStatus;
  /** "For Sale" or "For Lease". */
  transactionType: string;
  listPrice: number | null;
  /** Street line as allowed for display; null when the seller asked to hide the address. */
  street: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  /** e.g. "3 + 1" (above grade + below grade). */
  bedrooms: string | null;
  bathrooms: number | null;
  propertyType: string | null;
  /** Square-footage range as published on MLS®, e.g. "1500-2000". */
  sizeRange: string | null;
  description: string | null;
  listOffice: string | null;
  photos: string[];
  latitude: number | null;
  longitude: number | null;
  /** proptx: pulled by MLS® number. manual: typed in by PK on the admin page. */
  source: "proptx" | "dev-sample" | "manual";
  /** Hidden from the site by PK. Synced listings are hidden rather than deleted, so the hourly sync doesn't re-add them. */
  hidden?: boolean;
  /** Added by the hourly sync rather than by PK. */
  autoAdded?: boolean;
  /** Shows a "Sold over asking" badge (set by PK on manual listings). */
  soldOverAsking?: boolean;
  /** When the listing was last pulled from PropTx, or last edited by hand (ISO). */
  fetchedAt: string;
  /** When the MLS® record last changed (ISO), if known. */
  modifiedAt: string | null;
  /** When PK added it to the site (ISO). */
  addedAt: string;
};

/** Most photos a hand-entered listing can have. Extra photos on older listings are dropped when read. */
export const MAX_MANUAL_PHOTOS = 6;

export const statusLabel: Record<ListingStatus, string> = {
  active: "For sale",
  pending: "Sold conditional",
  sold: "Sold",
  leased: "Leased",
  purchased: "Purchased",
  "off-market": "Off market",
};

export function listingTitle(l: Pick<Listing, "street" | "city">) {
  return l.street ? `${l.street}, ${l.city}` : l.city;
}
