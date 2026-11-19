import type { Listing } from "@/lib/listings/types";
import { isPastDeal, statusLabel } from "@/lib/listings/types";

/** True when the listing should get the special "over asking" badge. */
export const isOverAsking = (l: Pick<Listing, "status" | "soldOverAsking">) =>
  Boolean(l.soldOverAsking) && (l.status === "sold" || l.status === "leased");

/**
 * "Sold over asking" / "Leased over asking": the logo cyan with an up-trend arrow,
 * a soft glow and a light sheen that sweeps across every few seconds (see .badge-over in globals.css).
 * Deliberately unlike the plain navy or white status badges.
 */
export function OverAskingBadge({ leased = false, className = "" }: { leased?: boolean; className?: string }) {
  return (
    <span className={`badge-over ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
      {leased ? "Leased over asking" : "Sold over asking"}
    </span>
  );
}

/** The badge on a listing photo: the over-asking badge when it applies, otherwise the plain status. */
export function StatusBadge({ listing, className = "" }: { listing: Listing; className?: string }) {
  if (isOverAsking(listing)) return <OverAskingBadge leased={listing.status === "leased"} className={className} />;
  const sold = isPastDeal(listing.status);
  return (
    <span
      className={`px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider ${
        sold ? "bg-navy-900 text-aqua-400" : "bg-mist-50 text-ink"
      } ${className}`}
    >
      {statusLabel[listing.status]}
    </span>
  );
}
