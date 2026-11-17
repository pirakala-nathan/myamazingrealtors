import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/content/home";
import { listingTitle, statusLabel, type Listing } from "@/lib/listings/types";

/** PropTx photos are served from PropTx's own image host, so they skip Next's optimizer. */
export const isRemote = (src: string) => /^https?:\/\//.test(src);

export function priceLine(l: Listing) {
  if (l.status === "active" || l.status === "pending") {
    if (!l.listPrice) return null;
    return `${formatPrice(l.listPrice)}${l.transactionType.toLowerCase().includes("lease") ? "/month" : ""}`;
  }
  return null; // Sold prices are not shown publicly.
}

export function factsLine(l: Listing) {
  return [
    l.bedrooms && `${l.bedrooms} bed`,
    l.bathrooms != null && `${l.bathrooms} bath`,
    l.propertyType,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0];
  const price = priceLine(listing);
  const sold = listing.status === "sold" || listing.status === "leased";
  return (
    <Link href={`/listings/${listing.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-300">
        {photo && (
          <Image
            src={photo}
            alt={`Front of ${listingTitle(listing)}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={isRemote(photo)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span
          className={`absolute left-4 top-4 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider ${
            sold ? "bg-noir-900 text-champagne-400" : "bg-ivory-50 text-noir-900"
          }`}
        >
          {statusLabel[listing.status]}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {price && <span className="font-display text-3xl font-semibold">{price}</span>}
        <span className="font-bold group-hover:text-champagne-700">{listingTitle(listing)}</span>
        <span className="text-sm text-muted">{factsLine(listing)}</span>
      </div>
    </Link>
  );
}
