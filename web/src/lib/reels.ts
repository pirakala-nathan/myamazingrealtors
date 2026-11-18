import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { firebaseConfigured } from "@/lib/env";

/**
 * Instagram reels PK features in the homepage "Watch PK" section, chosen on /admin.
 * Stored as an ordered list of post codes in Firestore settings/reels
 * (.data/reels.json in local development without Firebase).
 */
export const REELS_TAG = "reels";
export const MAX_REELS = 6;

/** Accepts instagram.com/reel/CODE, /reels/CODE, /p/CODE or /tv/CODE links (with or without a username or query). */
export const REEL_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/;

export const reelCode = (url: string) => url.trim().match(REEL_URL)?.[1] ?? null;
export const reelUrl = (code: string) => `https://www.instagram.com/reel/${code}/`;

const localFileMode = () => !firebaseConfigured() && process.env.NODE_ENV !== "production";
const LOCAL_PATH = () => `${process.cwd()}/.data/reels.json`;

async function read(): Promise<string[]> {
  if (localFileMode()) {
    const { readFile } = await import("node:fs/promises");
    try {
      return JSON.parse(await readFile(LOCAL_PATH(), "utf8")) as string[];
    } catch {
      return [];
    }
  }
  if (!firebaseConfigured()) return [];
  const { db } = await import("@/lib/firebase/admin");
  const snap = await db().collection("settings").doc("reels").get();
  return (snap.data()?.codes as string[] | undefined) ?? [];
}

/** Featured reel codes, in PK's order. Cached until PK changes them. */
export async function getReels(): Promise<string[]> {
  "use cache";
  cacheTag(REELS_TAG);
  cacheLife("days");
  return (await read()).slice(0, MAX_REELS);
}

/** Uncached, for the admin page. */
export const getReelsForAdmin = read;

export async function saveReels(codes: string[]) {
  if (localFileMode()) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(`${process.cwd()}/.data`, { recursive: true });
    await writeFile(LOCAL_PATH(), JSON.stringify(codes, null, 2));
    return;
  }
  const { db } = await import("@/lib/firebase/admin");
  await db().collection("settings").doc("reels").set({ codes, updatedAt: new Date().toISOString() });
}
