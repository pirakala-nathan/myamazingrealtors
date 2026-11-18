import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/lib/site";

/**
 * PK's Google rating and reviews, from Google's Places API (New) Place Details.
 * https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * Needs GOOGLE_PLACES_API_KEY. The place ID is site.googlePlaceId (GOOGLE_PLACE_ID overrides it).
 * Returns null when they are missing or the request fails, so pages fall back to placeholders.
 *
 * Google's rules for showing this data (Places API policies):
 * - credit each review's author (name and photo, linking to their profile),
 * - let visitors open the review on Google Maps,
 * - show "Google Maps" as the source, and say how reviews are ordered. The Places API returns at most 5 reviews,
 *   chosen by Google as "most relevant", with no option for newest; the site re-sorts those 5 newest first.
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
  /** RFC 3339 timestamp, used to sort newest first. */
  publishTime: string | null;
  reviewUri: string | null;
};

export type GoogleReviews = {
  rating: number;
  count: number;
  mapsUri: string | null;
  reviews: GoogleReview[];
  /** business-profile: PK's newest reviews. places: Google's 5 most relevant, re-sorted newest first. */
  source: "business-profile" | "places";
};

export const GOOGLE_REVIEWS_TAG = "google-reviews";

type ApiReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  publishTime?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

type ApiPlace = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: ApiReview[];
};

/**
 * PK's Google rating and reviews: from the Business Profile API when PK has connected it on /admin
 * (newest reviews first), otherwise from the Places API.
 */
export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  "use cache";
  cacheTag(GOOGLE_REVIEWS_TAG);
  cacheLife({ stale: 3600, revalidate: 6 * 3600, expire: 24 * 3600 });

  try {
    const { fetchBusinessReviews } = await import("@/lib/google-business");
    const business = await fetchBusinessReviews();
    if (business) return business;
  } catch (error) {
    console.error("[google-reviews] Business Profile request failed; using the Places API", error);
  }
  return placesReviews();
}

async function placesReviews(): Promise<GoogleReviews | null> {

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || site.googlePlaceId;
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
          publishTime: r.publishTime ?? null,
          reviewUri: r.googleMapsUri ?? null,
        }))
        .filter((r) => r.text.length > 0)
        // Newest first. Reviews without a date keep Google's order, after the dated ones.
        .sort((a, b) => (b.publishTime ?? "").localeCompare(a.publishTime ?? "")),
      source: "places",
    };
  } catch (error) {
    console.error("[google-reviews] request failed", error);
    return null;
  }
}

/** "4.9★" style rating for stat blocks. */
export const formatRating = (rating: number) => `${rating.toFixed(1)}★`;
