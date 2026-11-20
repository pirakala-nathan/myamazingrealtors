import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { STATE_COOKIE, authUrl, callbackUrl, oauthConfigured, wrongHost } from "@/lib/google-business";

/** Starts "Connect Google": sends PK to Google's consent screen for the Business Profile. */
export async function GET(request: NextRequest) {
  // Start on the canonical address, so the sign-in cookie and Google's callback are on the same host.
  const canonical = wrongHost(request.nextUrl.origin);
  if (canonical) return NextResponse.redirect(new URL("/admin/google/connect", canonical));
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url));
  if (!oauthConfigured()) return NextResponse.redirect(new URL("/admin?google=not-configured", request.url));

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
