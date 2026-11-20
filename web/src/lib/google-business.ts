import "server-only";
import { firebaseConfigured } from "@/lib/env";
import { site } from "@/lib/site";
import type { GoogleReview, GoogleReviews } from "@/lib/google-reviews";

/**
 * Google Business Profile API: PK's own reviews, newest first (unlike the Places API,
 * which returns only 5 "most relevant" reviews).
 * https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
 *
 * Setup (see docs/04-google-reviews-setup.md):
 * - Google approves API access per Cloud project (form; the profile must be verified 60+ days).
 * - GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET: an OAuth "Web application" client.
 * - PK clicks "Connect Google" on /admin once; the refresh token and the matched location are
 *   saved server-side (Firestore settings/googleBusiness; .data/google-business.json in local dev).
 */

/** Short-lived cookie holding the OAuth state while PK is on Google's consent screen. */
export const STATE_COOKIE = "mar_google_state";
export const SCOPE = "https://www.googleapis.com/auth/business.manage";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type BusinessConnection = {
  refreshToken: string;
  account: string; // accounts/123
  location: string; // locations/456
  title: string;
  mapsUri: string | null;
  connectedAt: string;
};

export const oauthConfigured = () =>
  Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);

// ---------------------------------------------------------------------------
// Where the connection is kept

const localFileMode = () => !firebaseConfigured() && process.env.NODE_ENV !== "production";
const LOCAL_PATH = () => `${process.cwd()}/.data/google-business.json`;

export async function getConnection(): Promise<BusinessConnection | null> {
  if (localFileMode()) {
    const { readFile } = await import("node:fs/promises");
    try {
      return JSON.parse(await readFile(LOCAL_PATH(), "utf8")) as BusinessConnection;
    } catch {
      return null;
    }
  }
  if (!firebaseConfigured()) return null;
  const { db } = await import("@/lib/firebase/admin");
  const snap = await db().collection("settings").doc("googleBusiness").get();
  return snap.exists ? (snap.data() as BusinessConnection) : null;
}

export async function saveConnection(c: BusinessConnection) {
  if (localFileMode()) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(`${process.cwd()}/.data`, { recursive: true });
    await writeFile(LOCAL_PATH(), JSON.stringify(c, null, 2));
    return;
  }
  const { db } = await import("@/lib/firebase/admin");
  await db().collection("settings").doc("googleBusiness").set(c);
}

export async function clearConnection() {
  if (localFileMode()) {
    const { rm } = await import("node:fs/promises");
    await rm(LOCAL_PATH(), { force: true });
    return;
  }
  if (!firebaseConfigured()) return;
  const { db } = await import("@/lib/firebase/admin");
  await db().collection("settings").doc("googleBusiness").delete();
}

// ---------------------------------------------------------------------------
// OAuth

/**
 * Where Google sends PK back after consent. It must exactly match a redirect URI on the OAuth client, so the
 * live site always uses its canonical address (site.url), whichever address the admin page was opened on;
 * local development uses the dev server's own address (http://localhost:3000).
 */
export function callbackUrl(requestOrigin: string) {
  const base = process.env.NODE_ENV === "production" ? site.url : requestOrigin;
  return new URL("/admin/google/callback", base).toString();
}

/** On the live site, the canonical origin when the request came in on another address (Netlify's, no www). */
export function wrongHost(requestOrigin: string) {
  const canonical = new URL(site.url).origin;
  return process.env.NODE_ENV === "production" && requestOrigin !== canonical ? canonical : null;
}

export function authUrl(state: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // ask for a refresh token
    prompt: "consent", // always return a refresh token, even on reconnect
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      ...body,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Google token request failed: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());
  }
  return json;
}

export const exchangeCode = (code: string, redirectUri: string) =>
  tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri });

const accessToken = async (refreshToken: string) =>
  (await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken })).access_token!;

async function api<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Google Business Profile API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

type Account = { name: string; accountName?: string };
type Location = { name: string; title?: string; metadata?: { placeId?: string; mapsUri?: string } };

/**
 * Finds PK's business among the locations this Google account manages:
 * the one whose place ID matches site.googlePlaceId, else the only/first one.
 */
export async function discoverLocation(token: string) {
  const { accounts = [] } = await api<{ accounts?: Account[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20",
    token,
  );
  const found: { account: string; location: Location }[] = [];
  for (const account of accounts) {
    const { locations = [] } = await api<{ locations?: Location[] }>(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,metadata&pageSize=100`,
      token,
    );
    for (const location of locations) found.push({ account: account.name, location });
  }
  const placeId = process.env.GOOGLE_PLACE_ID || site.googlePlaceId;
  const match = found.find((f) => f.location.metadata?.placeId === placeId) ?? found[0];
  if (!match) throw new Error("This Google account doesn't manage any Business Profile locations.");
  return {
    account: match.account,
    location: match.location.name,
    title: match.location.title ?? "Google Business Profile",
    mapsUri: match.location.metadata?.mapsUri ?? null,
    matchedPlaceId: match.location.metadata?.placeId === placeId,
  };
}

// ---------------------------------------------------------------------------
// Reviews

type ApiReview = {
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | "STAR_RATING_UNSPECIFIED";
  comment?: string;
  createTime?: string;
};

const stars: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/** "March 2026" (Google appends a translation to some comments; keep only the original). */
const monthYear = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "America/Toronto" }).format(new Date(iso));
const original = (comment: string) => comment.split(/\n\n\(Translated by Google\)/)[0].replace(/^\(Original\)\n/, "").trim();

/** PK's newest reviews with text, or null when not connected or the request fails. */
export async function fetchBusinessReviews(): Promise<GoogleReviews | null> {
  if (!oauthConfigured()) return null;
  const connection = await getConnection();
  if (!connection) return null;

  const token = await accessToken(connection.refreshToken);
  const data = await api<{ reviews?: ApiReview[]; averageRating?: number; totalReviewCount?: number }>(
    `https://mybusiness.googleapis.com/v4/${connection.account}/${connection.location}/reviews?pageSize=50&orderBy=${encodeURIComponent("updateTime desc")}`,
    token,
  );

  const reviews: GoogleReview[] = (data.reviews ?? [])
    .filter((r) => r.comment?.trim() && r.createTime)
    .sort((a, b) => b.createTime!.localeCompare(a.createTime!)) // newest written first (not newest edited)
    .slice(0, 10)
    .map((r) => ({
      author: r.reviewer?.isAnonymous ? "A Google user" : (r.reviewer?.displayName ?? "A Google user"),
      authorUri: null,
      authorPhoto: r.reviewer?.isAnonymous ? null : (r.reviewer?.profilePhotoUrl ?? null),
      rating: stars[r.starRating ?? ""] ?? 0,
      text: original(r.comment!),
      relativeTime: monthYear(r.createTime!),
      publishTime: r.createTime!,
      reviewUri: connection.mapsUri,
    }));

  if (typeof data.averageRating !== "number") return null;
  return {
    rating: data.averageRating,
    count: data.totalReviewCount ?? 0,
    mapsUri: connection.mapsUri,
    reviews,
    source: "business-profile",
  };
}
