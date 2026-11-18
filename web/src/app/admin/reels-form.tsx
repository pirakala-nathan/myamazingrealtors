"use client";

import { useActionState, useState } from "react";
import {
  saveReelList,
  startReelUpload,
  uploadListingPhoto,
  uploadReelChunk,
  type AdminFormState,
} from "@/app/actions/admin";

export type ReelItem = {
  id: string;
  video: string | null;
  poster: string | null;
  title: string | null;
  instagramUrl: string | null;
};

const initial: AdminFormState = { status: "idle" };
const CHUNK_BYTES = 3 * 1024 * 1024; // matches lib/videos.ts
const input =
  "w-full rounded-none border border-cloud-400 bg-white px-3 py-2.5 text-[15px] text-ink focus:border-navy-900 focus:outline-none";
const small = "min-w-9 border border-navy-900 px-2 py-1.5 text-sm font-bold disabled:opacity-30";

/** Grabs a still frame (about 1s in) from a local video file to use as the poster image. */
async function capturePoster(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("unreadable"));
    });
    video.currentTime = Math.min(1, (video.duration || 2) / 2);
    await new Promise<void>((resolve) => (video.onseeked = () => resolve()));
    const scale = Math.min(1, 1080 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ReelsManager({ initialReels, max }: { initialReels: ReelItem[]; max: number }) {
  const [reels, setReels] = useState<ReelItem[]>(initialReels);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(saveReelList, initial);
  const uploading = Object.keys(progress).length > 0;

  const update = (id: string, patch: Partial<ReelItem>) => setReels((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (from: number, to: number) =>
    setReels((r) => {
      if (to < 0 || to >= r.length) return r;
      const next = [...r];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  async function uploadVideo(id: string, file: File) {
    setErrors((e) => ({ ...e, [id]: "" }));
    const type = file.type || (file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4");
    setProgress((p) => ({ ...p, [id]: "Starting…" }));
    try {
      const started = await startReelUpload(type, file.size);
      if (!started.session || !started.url) throw new Error(started.error ?? "Upload couldn’t start.");
      for (let start = 0; start < file.size; start += CHUNK_BYTES) {
        const fd = new FormData();
        fd.append("session", started.session);
        fd.append("start", String(start));
        fd.append("total", String(file.size));
        fd.append("chunk", file.slice(start, start + CHUNK_BYTES), "chunk");
        const res = await uploadReelChunk(fd);
        if (res.error) throw new Error(res.error);
        setProgress((p) => ({ ...p, [id]: `Uploading ${Math.min(100, Math.round(((start + CHUNK_BYTES) / file.size) * 100))}%` }));
      }

      setProgress((p) => ({ ...p, [id]: "Making a preview image…" }));
      let poster: string | null = null;
      const still = await capturePoster(file);
      if (still) {
        const fd = new FormData();
        fd.append("photo", new File([still], "poster.jpg", { type: "image/jpeg" }));
        poster = (await uploadListingPhoto(fd)).url ?? null;
      }
      update(id, { video: started.url, poster });
    } catch (error) {
      setErrors((e) => ({ ...e, [id]: error instanceof Error ? error.message : "Upload failed." }));
    } finally {
      setProgress((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="reels" value={JSON.stringify(reels)} />

      {reels.length === 0 && <p className="text-muted">No reels yet.</p>}
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reels.map((reel, i) => (
          <li key={reel.id} className="flex gap-3 border border-cloud-300 bg-white p-3">
            <div className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden bg-navy-900">
              {reel.poster ? (
                // Admin preview of the uploaded reel's still frame.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={reel.poster} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center p-2 text-center text-[11px] font-bold text-on-dark-subtle">
                  {reel.video ? "Video ready" : "No video yet"}
                </span>
              )}
              <span className="absolute left-1 top-1 bg-navy-900 px-1.5 py-0.5 text-[11px] font-extrabold text-aqua-400">{i + 1}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label className="sr-only" htmlFor={`title-${reel.id}`}>
                Title for reel {i + 1}
              </label>
              <input
                id={`title-${reel.id}`}
                value={reel.title ?? ""}
                maxLength={80}
                onChange={(e) => update(reel.id, { title: e.target.value })}
                placeholder="Title, e.g. Inside 27 Aldgate Cres."
                className={input}
              />
              <label className="sr-only" htmlFor={`ig-${reel.id}`}>
                Instagram link for reel {i + 1}
              </label>
              <input
                id={`ig-${reel.id}`}
                value={reel.instagramUrl ?? ""}
                onChange={(e) => update(reel.id, { instagramUrl: e.target.value || null })}
                placeholder="Instagram link (optional)"
                inputMode="url"
                className={input}
              />
              <label
                className={`inline-flex min-h-10 cursor-pointer items-center justify-center border-[1.5px] border-navy-900 px-3 text-sm font-bold ${
                  progress[reel.id] ? "cursor-wait opacity-70" : "hover:bg-navy-900 hover:text-on-dark"
                }`}
              >
                {progress[reel.id] ?? (reel.video ? "Replace video" : "Upload video")}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="sr-only"
                  disabled={Boolean(progress[reel.id])}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadVideo(reel.id, file);
                    e.target.value = "";
                  }}
                />
              </label>
              {errors[reel.id] && (
                <p role="alert" className="text-xs font-semibold text-red-800">
                  {errors[reel.id]}
                </p>
              )}
              <div className="flex gap-1.5">
                <button type="button" className={small} disabled={i === 0} aria-label={`Move reel ${i + 1} earlier`} onClick={() => move(i, i - 1)}>
                  ←
                </button>
                <button
                  type="button"
                  className={small}
                  disabled={i === reels.length - 1}
                  aria-label={`Move reel ${i + 1} later`}
                  onClick={() => move(i, i + 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  className={`${small} ml-auto border-red-800 text-red-800`}
                  onClick={() => setReels((r) => r.filter((x) => x.id !== reel.id))}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={reels.length >= max}
          className="min-h-12 border-[1.5px] border-navy-900 px-6 font-bold disabled:opacity-40"
          onClick={() =>
            setReels((r) => [...r, { id: crypto.randomUUID(), video: null, poster: null, title: null, instagramUrl: null }])
          }
        >
          {reels.length >= max ? `${max} reels (maximum)` : "Add a reel"}
        </button>
        <button
          type="submit"
          disabled={pending || uploading}
          className="min-h-12 bg-navy-900 px-8 font-bold text-on-dark hover:bg-navy-700 disabled:opacity-70"
        >
          {pending ? "Saving…" : uploading ? "Wait for uploads…" : "Save reels"}
        </button>
        {state.message && (
          <p role={state.status === "error" ? "alert" : "status"} className={`text-sm font-semibold ${state.status === "error" ? "text-red-800" : "text-aqua-700"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
