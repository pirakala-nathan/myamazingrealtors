import "server-only";
import { randomUUID } from "node:crypto";
import { firebaseConfigured } from "@/lib/env";

/**
 * Stores a listing photo PK uploads on the admin page and returns its public URL.
 * - With Firebase: Cloud Storage under listings/, served through a Firebase download token.
 * - Local development without Firebase: public/uploads/listings/ (git-ignored).
 */
export async function savePhoto(data: Buffer, contentType: string): Promise<string> {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const name = `${randomUUID()}.${ext}`;

  if (firebaseConfigured()) {
    const { bucket } = await import("@/lib/firebase/admin");
    const b = bucket();
    const path = `listings/${name}`;
    const token = randomUUID();
    await b.file(path).save(data, {
      resumable: false,
      contentType,
      metadata: { cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } },
    });
    return `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Photo storage isn't set up (Firebase variables are missing).");
  }
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = `${process.cwd()}/public/uploads/listings`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/${name}`, data);
  return `/uploads/listings/${name}`;
}
