import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { firebaseConfigured } from "@/lib/env";

/**
 * Reels PK features in the homepage "Watch PK" section, managed on /admin.
 * Each reel is a video file PK uploads (played in the site's own player), with an optional
 * title and a link back to the original post on Instagram.
 * Stored in Firestore settings/reels ({ items }), or .data/reels.json in local development.
 */
export const REELS_TAG = "reels";
export const MAX_REELS = 6;

export type Reel = {
  id: string;
  /** Video URL (Firebase Storage, or /uploads/ in local development). Null until uploaded. */
  video: string | null;
  /**
   * Full HD (1080p) copy for the full-screen player on iPads and computers, where the lighter `video`
   * would look soft. Null for reels uploaded before this existed or already small; the player then uses `video`.
   */
  videoHd?: string | null;
  /** Still image shown before the video plays. */
  poster: string | null;
  title: string | null;
  instagramUrl: string | null;
};

/** Accepts instagram.com/reel/CODE, /reels/CODE, /p/CODE or /tv/CODE links (with or without a username or query). */
export const REEL_URL = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/;
export const reelCode = (url: string) => url.trim().match(REEL_URL)?.[1] ?? null;
export const reelUrl = (code: string) => `https://www.instagram.com/reel/${code}/`;

const localFileMode = () => !firebaseConfigured() && process.env.NODE_ENV !== "production";
const LOCAL_PATH = () => `${process.cwd()}/.data/reels.json`;

/** Reads the saved list. The first version stored Instagram post codes only; those become reels awaiting a video. */
function normalise(raw: unknown): Reel[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((item): Reel | null => {
      if (typeof item === "string") {
        return { id: `ig-${item}`, video: null, poster: null, title: null, instagramUrl: reelUrl(item) };
      }
      if (item && typeof item === "object" && "id" in item) return item as Reel;
      return null;
    })
    .filter((r): r is Reel => r !== null);
}

async function read(): Promise<Reel[]> {
  if (localFileMode()) {
    const { readFile } = await import("node:fs/promises");
    try {
      return normalise(JSON.parse(await readFile(LOCAL_PATH(), "utf8")));
    } catch {
      return [];
    }
  }
  if (!firebaseConfigured()) return [];
  const { db } = await import("@/lib/firebase/admin");
  const data = (await db().collection("settings").doc("reels").get()).data();
  return normalise(data?.items ?? data?.codes);
}

/** Reels with a video, in PK's order, for the homepage. Cached until PK changes them. */
export async function getReels(): Promise<Reel[]> {
  "use cache";
  cacheTag(REELS_TAG);
  cacheLife("days");
  return (await read()).filter((r) => r.video).slice(0, MAX_REELS);
}

/** Every saved reel, including ones still waiting for a video. Uncached, for the admin page. */
export const getReelsForAdmin = read;

export async function saveReels(items: Reel[]) {
  if (localFileMode()) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    await mkdir(`${process.cwd()}/.data`, { recursive: true });
    await writeFile(LOCAL_PATH(), JSON.stringify(items, null, 2));
    return;
  }
  const { db } = await import("@/lib/firebase/admin");
  await db().collection("settings").doc("reels").set({ items, updatedAt: new Date().toISOString() });
}
