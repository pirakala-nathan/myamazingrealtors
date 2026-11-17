/** A listing PK has added to the site, stored in Firestore under its MLS® number. */
export type ListingStatus = "active" | "pending" | "sold" | "leased" | "off-market";

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
  source: "proptx" | "dev-sample";
  /** When the listing was last pulled from PropTx (ISO). */
  fetchedAt: string;
  /** When the MLS® record last changed (ISO), if known. */
  modifiedAt: string | null;
  /** When PK added it to the site (ISO). */
  addedAt: string;
};

export const statusLabel: Record<ListingStatus, string> = {
  active: "For sale",
  pending: "Sold conditional",
  sold: "Sold",
  leased: "Leased",
  "off-market": "Off market",
};

export function listingTitle(l: Pick<Listing, "street" | "city">) {
  return l.street ? `${l.street}, ${l.city}` : l.city;
}
