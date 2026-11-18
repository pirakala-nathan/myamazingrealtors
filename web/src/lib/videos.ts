import "server-only";
import { randomUUID } from "node:crypto";
import { firebaseConfigured } from "@/lib/env";

/**
 * Uploads large videos (reels) in pieces, so no single request goes over the hosting limit.
 * - With Firebase: a Cloud Storage resumable upload session under reels/. The browser sends
 *   chunks to our server, which forwards each to the session (server to server, so no bucket CORS setup).
 * - Local development without Firebase: chunks are appended to public/uploads/reels/.
 */
export const CHUNK_BYTES = 3 * 1024 * 1024; // must be a multiple of 256 KiB for Cloud Storage
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export type VideoUpload = { session: string; url: string };

const LOCAL_PREFIX = "local:";
const GCS_SESSION = /^https:\/\/storage\.googleapis\.com\/upload\/storage\/v1\/b\/[^/]+\/o\?/;

export async function startVideoUpload(contentType: string): Promise<VideoUpload> {
  const ext = contentType === "video/webm" ? "webm" : contentType === "video/quicktime" ? "mov" : "mp4";
  const name = `${randomUUID()}.${ext}`;

  if (firebaseConfigured()) {
    const { bucket } = await import("@/lib/firebase/admin");
    const b = bucket();
    const path = `reels/${name}`;
    const token = randomUUID();
    const [session] = await b.file(path).createResumableUpload({
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    return {
      session,
      url: `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
    };
  }

  if (process.env.NODE_ENV === "production") throw new Error("Video storage isn't set up (Firebase variables are missing).");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = `${process.cwd()}/public/uploads/reels`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/${name}`, new Uint8Array());
  return { session: `${LOCAL_PREFIX}${name}`, url: `/uploads/reels/${name}` };
}

/** Sends one chunk. Returns true once the whole file has been received. */
export async function uploadVideoChunk(session: string, start: number, total: number, chunk: Uint8Array) {
  const end = start + chunk.byteLength - 1;
  if (session.startsWith(LOCAL_PREFIX)) {
    const name = session.slice(LOCAL_PREFIX.length);
    if (!/^[0-9a-f-]{36}\.(mp4|mov|webm)$/.test(name)) throw new Error("Invalid upload");
    const { appendFile } = await import("node:fs/promises");
    await appendFile(`${process.cwd()}/public/uploads/reels/${name}`, chunk);
    return end + 1 >= total;
  }

  if (!GCS_SESSION.test(session)) throw new Error("Invalid upload session");
  const res = await fetch(session, {
    method: "PUT",
    headers: { "Content-Range": `bytes ${start}-${end}/${total}` },
    body: chunk as unknown as BodyInit,
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 308) return false; // more to come
  if (res.ok) return true;
  throw new Error(`Cloud Storage responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
