import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { STATE_COOKIE, callbackUrl, discoverLocation, exchangeCode, saveConnection } from "@/lib/google-business";
import { GOOGLE_REVIEWS_TAG } from "@/lib/google-reviews";

const back = (request: NextRequest, result: string) =>
  NextResponse.redirect(new URL(`/admin?google=${result}`, request.url));

/** Google sends PK back here after consent: save the refresh token and find the business location. */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url));

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete(STATE_COOKIE);
  const params = request.nextUrl.searchParams;
  const state = params.get("state") ?? "";
  if (!expected || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
    return back(request, "error-state");
  }
  if (params.get("error")) return back(request, "cancelled");
  const code = params.get("code");
  if (!code) return back(request, "error");

  try {
    const tokens = await exchangeCode(code, callbackUrl(request.nextUrl.origin));
    if (!tokens.refresh_token) return back(request, "error-no-refresh-token");
    const found = await discoverLocation(tokens.access_token!);
    await saveConnection({
      refreshToken: tokens.refresh_token,
      account: found.account,
      location: found.location,
      title: found.title,
      mapsUri: found.mapsUri,
      connectedAt: new Date().toISOString(),
    });
    revalidateTag(GOOGLE_REVIEWS_TAG, { expire: 0 });
    return back(request, found.matchedPlaceId ? "connected" : "connected-unmatched");
  } catch (error) {
    console.error("[google] connect failed", error);
    const message = String(error);
    return back(request, message.includes(" 403") || message.includes("PERMISSION_DENIED") ? "error-access" : "error");
  }
}
