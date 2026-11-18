"use server";

import { updateTag } from "next/cache";
import { clearConnection } from "@/lib/google-business";
import { GOOGLE_REVIEWS_TAG } from "@/lib/google-reviews";
import { redirect } from "next/navigation";
import { adminConfigured, endSession, passwordMatches, requireAdmin, startSession } from "@/lib/admin-auth";
import { z } from "zod";
import { LookupError, MLS_PATTERN, lookupListing, sampleListing, slugFor } from "@/lib/listings/proptx";
import { savePhoto } from "@/lib/listings/photos";
import { site } from "@/lib/site";
import { LISTINGS_TAG, deleteListing, findListing, saveListing } from "@/lib/listings/store";
import { MAX_MANUAL_PHOTOS, listingTitle, type Listing } from "@/lib/listings/types";

export type AdminFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function login(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  if (!adminConfigured()) {
    return { status: "error", message: "Admin sign-in isn’t set up yet. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { status: "error", message: "That password isn’t right." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/** Pulls a listing from PropTx, or the dev sample when no token is set outside production. */
async function pull(mlsNumber: string) {
  const token = process.env.PROPTX_TOKEN;
  if (token) return lookupListing(mlsNumber, token);
  if (process.env.NODE_ENV !== "production") return sampleListing(mlsNumber);
  throw new LookupError("The PropTx connection isn’t set up yet (PROPTX_TOKEN is missing).");
}

function failure(error: unknown): AdminFormState {
  if (error instanceof LookupError) return { status: "error", message: error.message };
  console.error("[admin] listing lookup failed", error);
  return { status: "error", message: "Something went wrong. Please try again." };
}

export async function addListing(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const mlsNumber = String(formData.get("mlsNumber") ?? "")
    .trim()
    .toUpperCase();
  if (!MLS_PATTERN.test(mlsNumber)) {
    return { status: "error", message: "Enter an MLS® number such as E12345678." };
  }

  try {
    const existing = await findListing(mlsNumber);
    const pulled = await pull(mlsNumber);
    if (!pulled) {
      return {
        status: "error",
        message: `No listing ${mlsNumber} in your PropTx feed. Your agreement covers RE/MAX Community listings only.`,
      };
    }
    const listing: Listing = { ...pulled, addedAt: existing?.addedAt ?? new Date().toISOString() };
    await saveListing(listing);
    updateTag(LISTINGS_TAG);
    return {
      status: "success",
      message: `${existing ? "Updated" : "Added"} ${listingTitle(listing)} (${mlsNumber}).`,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function refreshListing(mlsNumber: string) {
  await requireAdmin();
  const existing = await findListing(mlsNumber);
  if (!existing || existing.source === "manual") return; // typed-in listings are edited by hand, not refreshed
  try {
    const pulled = await pull(mlsNumber);
    // Gone from the feed (expired, terminated or moved): keep the page but mark it off market.
    const listing: Listing = pulled
      ? { ...pulled, addedAt: existing.addedAt }
      : { ...existing, status: "off-market", fetchedAt: new Date().toISOString() };
    await saveListing(listing);
    updateTag(LISTINGS_TAG);
  } catch (error) {
    console.error("[admin] refresh failed", error);
  }
}

export async function removeListing(mlsNumber: string) {
  await requireAdmin();
  await deleteListing(mlsNumber);
  updateTag(LISTINGS_TAG);
}

// ---------------------------------------------------------------------------
// Listings typed in by hand (until PropTx is connected, or for listings outside the feed)

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Uploads one photo (already resized in the browser) and returns its URL. */
export async function uploadListingPhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "No photo received." };
  if (!PHOTO_TYPES.includes(file.type)) return { error: `${file.name}: use a JPG, PNG or WebP photo.` };
  if (file.size > MAX_PHOTO_BYTES) return { error: `${file.name} is too large.` };
  try {
    return { url: await savePhoto(Buffer.from(await file.arrayBuffer()), file.type) };
  } catch (error) {
    console.error("[admin] photo upload failed", error);
    return { error: "The photo couldn’t be saved. Check the Firebase Storage setup." };
  }
}

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => v || null);

const manualSchema = z.object({
  mlsNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(MLS_PATTERN, "Enter the MLS® number, such as E12345678."),
  street: text(120).min(3, "Enter the street address."),
  city: text(60).min(2, "Enter the city."),
  postalCode: optionalText(10),
  status: z.enum(["active", "pending", "sold", "leased", "off-market"]),
  transactionType: z.enum(["For Sale", "For Lease"]),
  listPrice: z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .refine((v) => v === "" || /^\d{3,9}(\.\d{1,2})?$/.test(v), "Enter a price like 899900.")
    .transform((v) => (v ? Math.round(Number(v)) : null)),
  bedrooms: optionalText(12),
  bathrooms: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{1,2}(\.5)?$/.test(v), "Enter a number like 2 or 2.5.")
    .transform((v) => (v ? Number(v) : null)),
  propertyType: optionalText(60),
  sizeRange: optionalText(30),
  description: optionalText(4000),
  soldOverAsking: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  photos: z
    .string()
    .transform((v, ctx) => {
      try {
        const list = JSON.parse(v || "[]");
        if (Array.isArray(list) && list.every((u) => typeof u === "string" && /^(https:\/\/|\/uploads\/|\/images\/)/.test(u))) {
          if (list.length > MAX_MANUAL_PHOTOS) {
            ctx.addIssue({ code: "custom", message: `Up to ${MAX_MANUAL_PHOTOS} photos. Remove ${list.length - MAX_MANUAL_PHOTOS} first.` });
            return z.NEVER;
          }
          return list as string[];
        }
      } catch {}
      ctx.addIssue({ code: "custom", message: "The photo list is invalid. Please re-add the photos." });
      return z.NEVER;
    }),
  originalMlsNumber: z.string().optional(),
});

/** Creates or updates a listing PK typed in by hand. */
export async function saveManualListing(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;
  const editing = d.originalMlsNumber ? await findListing(d.originalMlsNumber) : null;
  const clash = await findListing(d.mlsNumber);
  if (clash && clash.mlsNumber !== editing?.mlsNumber) {
    return { status: "error", fieldErrors: { mlsNumber: ["That MLS® number is already on the site. Edit it instead."] } };
  }

  const now = new Date().toISOString();
  const listing: Listing = {
    mlsNumber: d.mlsNumber,
    slug: slugFor(d.street, d.city, d.mlsNumber),
    status: d.status,
    transactionType: d.transactionType,
    listPrice: d.listPrice,
    street: d.street,
    city: d.city,
    province: "ON",
    postalCode: d.postalCode,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    propertyType: d.propertyType,
    sizeRange: d.sizeRange,
    description: d.description,
    listOffice: site.brokerage.name,
    photos: d.photos,
    latitude: null,
    longitude: null,
    source: "manual",
    soldOverAsking: d.status === "sold" || d.status === "leased" ? d.soldOverAsking : false,
    fetchedAt: now,
    modifiedAt: now,
    addedAt: editing?.addedAt ?? now,
  };

  try {
    if (editing && editing.mlsNumber !== listing.mlsNumber) await deleteListing(editing.mlsNumber);
    await saveListing(listing);
  } catch (error) {
    console.error("[admin] manual listing save failed", error);
    return { status: "error", message: "The listing couldn’t be saved. Please try again." };
  }
  updateTag(LISTINGS_TAG);
  if (editing) redirect("/admin?saved=" + encodeURIComponent(listing.mlsNumber));
  return { status: "success", message: `Added ${listingTitle(listing)} (${listing.mlsNumber}).` };
}

/** Forgets the Business Profile connection; the site falls back to the Places API reviews. */
export async function disconnectGoogle() {
  await requireAdmin();
  await clearConnection();
  updateTag(GOOGLE_REVIEWS_TAG);
}

// ---------------------------------------------------------------------------
// Reels for the homepage "Watch PK" section

/** Starts uploading a reel video; the browser then sends it in chunks with uploadReelChunk. */
export async function startReelUpload(contentType: string, size: number): Promise<{ session?: string; url?: string; error?: string }> {
  await requireAdmin();
  const { MAX_VIDEO_BYTES, VIDEO_TYPES, startVideoUpload } = await import("@/lib/videos");
  if (!VIDEO_TYPES.includes(contentType)) return { error: "Use an MP4 or MOV video." };
  if (size <= 0 || size > MAX_VIDEO_BYTES) return { error: `Videos can be up to ${MAX_VIDEO_BYTES / 1024 / 1024} MB.` };
  try {
    return await startVideoUpload(contentType);
  } catch (error) {
    console.error("[admin] starting video upload failed", error);
    return { error: "The video upload couldn’t start. Check the Firebase Storage setup." };
  }
}

/** Receives one chunk of a reel video (the form data holds session, start, total and chunk). */
export async function uploadReelChunk(formData: FormData): Promise<{ done?: boolean; error?: string }> {
  await requireAdmin();
  const { CHUNK_BYTES, MAX_VIDEO_BYTES, uploadVideoChunk } = await import("@/lib/videos");
  const session = String(formData.get("session") ?? "");
  const start = Number(formData.get("start"));
  const total = Number(formData.get("total"));
  const chunk = formData.get("chunk");
  if (!(chunk instanceof File) || chunk.size === 0 || chunk.size > CHUNK_BYTES) return { error: "Bad chunk." };
  if (!Number.isInteger(start) || start < 0 || !Number.isInteger(total) || total > MAX_VIDEO_BYTES) return { error: "Bad range." };
  try {
    return { done: await uploadVideoChunk(session, start, total, new Uint8Array(await chunk.arrayBuffer())) };
  } catch (error) {
    console.error("[admin] video chunk failed", error);
    return { error: "Part of the video didn’t upload. Please try again." };
  }
}

const reelSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(60),
      video: z
        .string()
        .regex(/^(https:\/\/firebasestorage\.googleapis\.com\/|\/uploads\/reels\/)/)
        .nullable(),
      poster: z
        .string()
        .regex(/^(https:\/\/|\/uploads\/)/)
        .nullable(),
      title: z
        .string()
        .trim()
        .max(80)
        .nullable()
        .transform((v) => v || null),
      instagramUrl: z.string().trim().max(300).nullable(),
    }),
  )
  .max(6);

/** Saves the reels list (order, titles, Instagram links, uploaded videos). */
export async function saveReelList(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const { REELS_TAG, reelCode, reelUrl, saveReels } = await import("@/lib/reels");
  let parsed;
  try {
    parsed = reelSchema.safeParse(JSON.parse(String(formData.get("reels") ?? "[]")));
  } catch {
    return { status: "error", message: "Something went wrong reading the list. Please reload the page." };
  }
  if (!parsed.success) return { status: "error", message: "Up to 6 reels, each with a valid video." };

  const items = [];
  for (const [i, r] of parsed.data.entries()) {
    let instagramUrl: string | null = null;
    if (r.instagramUrl) {
      const code = reelCode(r.instagramUrl);
      if (!code) return { status: "error", message: `Reel ${i + 1}: the Instagram link isn’t a reel or post link.` };
      instagramUrl = reelUrl(code);
    }
    items.push({ ...r, instagramUrl });
  }

  try {
    await saveReels(items);
  } catch (error) {
    console.error("[admin] saving reels failed", error);
    return { status: "error", message: "The reels couldn’t be saved. Please try again." };
  }
  updateTag(REELS_TAG);
  const live = items.filter((r) => r.video).length;
  const waiting = items.length - live;
  return {
    status: "success",
    message:
      `Saved. ${live} reel${live === 1 ? "" : "s"} on the homepage` +
      (waiting ? `; ${waiting} still need${waiting === 1 ? "s" : ""} a video.` : "."),
  };
}
