import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { STATE_COOKIE, authUrl, callbackUrl, oauthConfigured, siteUrl } from "@/lib/google-business";

/** Starts "Connect Google": sends PK to Google's consent screen for the Business Profile. */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(siteUrl("/admin/login", request.nextUrl.origin));
  if (!oauthConfigured()) return NextResponse.redirect(siteUrl("/admin?google=not-configured", request.nextUrl.origin));

  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/google",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl(state, callbackUrl(request.nextUrl.origin)));
}
