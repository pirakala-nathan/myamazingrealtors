"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfigured, endSession, passwordMatches, requireAdmin, startSession } from "@/lib/admin-auth";
import { LookupError, MLS_PATTERN, lookupListing, sampleListing } from "@/lib/listings/proptx";
import { LISTINGS_TAG, deleteListing, findListing, saveListing } from "@/lib/listings/store";
import { listingTitle, type Listing } from "@/lib/listings/types";

export type AdminFormState = { status: "idle" | "success" | "error"; message?: string };

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
  if (!existing) return;
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
