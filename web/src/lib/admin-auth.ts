import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * PK-only admin sign-in: one password (ADMIN_PASSWORD) and a signed, http-only
 * session cookie (ADMIN_SESSION_SECRET). No user accounts are stored anywhere.
 */
const COOKIE = "mar_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (at least 32 characters). See .env.example.");
  return s;
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

function equal(a: string, b: string) {
  // Hash first so the comparison is constant-time regardless of length.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32);
}

export function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && equal(input, expected!);
}

export async function startSession() {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !equal(signature, sign(expires))) return false;
  return Number(expires) > Date.now() / 1000;
}

/** Use at the top of every admin page and admin Server Function. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
