import "server-only";
import { cacheLife } from "next/cache";

/**
 * PK's Google rating and reviews, from Google's Places API (New) Place Details.
 * https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * Needs GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID (the Google Business Profile's place ID).
 * Returns null when they are missing or the request fails, so pages fall back to placeholders.
 *
 * Google's rules for showing this data (Places API policies):
 * - credit each review's author (name and photo, linking to their profile),
 * - let visitors open the review on Google Maps,
 * - show "Google Maps" as the source, and say how reviews are ordered (Google returns up to 5, most relevant first),
 * - don't store reviews: they are refetched every few hours rather than saved in a database.
 *
 * Billing: requesting reviews uses the "Place Details Enterprise + Atmosphere" SKU
 * (1,000 free requests a month at the time of writing). Refreshing every 6 hours is about 120 a month.
 */

export type GoogleReview = {
  author: string;
  authorUri: string | null;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  reviewUri: string | null;
};

export type GoogleReviews = {
  rating: number;
  count: number;
  mapsUri: string | null;
  reviews: GoogleReview[];
};

type ApiReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type ApiPlace = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: ApiReview[];
};

export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 6 * 3600, expire: 24 * 3600 });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[google-reviews] Places API responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return null;
    }
    const place = (await res.json()) as ApiPlace;
    if (typeof place.rating !== "number") return null;

    return {
      rating: place.rating,
      count: place.userRatingCount ?? 0,
      mapsUri: place.googleMapsUri ?? null,
      reviews: (place.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "Google user",
          authorUri: r.authorAttribution?.uri ?? null,
          authorPhoto: r.authorAttribution?.photoUri ?? null,
          rating: r.rating ?? 0,
          text: (r.text?.text ?? r.originalText?.text ?? "").trim(),
          relativeTime: r.relativePublishTimeDescription ?? "",
          reviewUri: r.googleMapsUri ?? null,
        }))
        .filter((r) => r.text.length > 0),
    };
  } catch (error) {
    console.error("[google-reviews] request failed", error);
    return null;
  }
}

/** "4.9★" style rating for stat blocks. */
export const formatRating = (rating: number) => `${rating.toFixed(1)}★`;
