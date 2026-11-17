import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { firebaseConfigured } from "@/lib/env";
import type { Listing } from "./types";

/**
 * Listings live in the Firestore collection `listings`, one document per MLS® number.
 * In local development without Firebase keys, a JSON file (.data/listings.json,
 * git-ignored) stands in so the pages can be tried.
 */
export const LISTINGS_TAG = "listings";
const COLLECTION = "listings";

const localFileMode = () => !firebaseConfigured() && process.env.NODE_ENV !== "production";

async function fileStore() {
  const { readFile, writeFile, mkdir } = await import("node:fs/promises");
  const path = `${process.cwd()}/.data/listings.json`;
  return {
    async read(): Promise<Listing[]> {
      try {
        return JSON.parse(await readFile(path, "utf8")) as Listing[];
      } catch {
        return [];
      }
    },
    async write(listings: Listing[]) {
      await mkdir(`${process.cwd()}/.data`, { recursive: true });
      await writeFile(path, JSON.stringify(listings, null, 2));
    },
  };
}

async function firestore() {
  const { db } = await import("@/lib/firebase/admin");
  return db().collection(COLLECTION);
}

async function readAll(): Promise<Listing[]> {
  if (localFileMode()) return (await fileStore()).read();
  if (!firebaseConfigured()) return [];
  const snap = await (await firestore()).get();
  return snap.docs.map((d) => d.data() as Listing);
}

const order: Record<Listing["status"], number> = { active: 0, pending: 1, sold: 2, leased: 2, "off-market": 3 };

/** All listings on the site: active first, then newest added. Cached until a listing changes. */
export async function getListings(): Promise<Listing[]> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("days");
  const all = await readAll();
  return all.sort((a, b) => order[a.status] - order[b.status] || b.addedAt.localeCompare(a.addedAt));
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  "use cache";
  cacheTag(LISTINGS_TAG);
  cacheLife("days");
  return (await readAll()).find((l) => l.slug === slug) ?? null;
}

/** Uncached read for the admin page. */
export async function getListingsForAdmin() {
  const all = await readAll();
  return all.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function saveListing(listing: Listing) {
  if (localFileMode()) {
    const store = await fileStore();
    const rest = (await store.read()).filter((l) => l.mlsNumber !== listing.mlsNumber);
    await store.write([...rest, listing]);
    return;
  }
  await (await firestore()).doc(listing.mlsNumber).set(listing);
}

export async function findListing(mlsNumber: string) {
  return (await readAll()).find((l) => l.mlsNumber === mlsNumber) ?? null;
}

export async function deleteListing(mlsNumber: string) {
  if (localFileMode()) {
    const store = await fileStore();
    await store.write((await store.read()).filter((l) => l.mlsNumber !== mlsNumber));
    return;
  }
  await (await firestore()).doc(mlsNumber).delete();
}
