/**
 * Shrinks a reel in the browser before upload, using Mediabunny (https://mediabunny.dev),
 * which drives the browser's own hardware video encoder (WebCodecs).
 *
 * Each reel is saved in two versions (MP4, H.264 video + AAC/Opus audio):
 * - "light": 720p, about 2 Mbps. Plays in the homepage row everywhere and full screen on phones,
 *   where it looks sharp and starts without a wait (a 60-second reel is about 15 MB).
 * - "hd": 1080p, about 6 Mbps. Plays full screen on iPads and computers so it stays crisp on big screens.
 * Videos are never enlarged: a 720p original stays 720p.
 *
 * Returns null when the browser can't do it (older browsers, unusual files) or when it wouldn't
 * make the file smaller; the caller then uses the original.
 */
export const RENDITIONS = {
  light: { longEdge: 1280, bitrate: 2_000_000 },
  hd: { longEdge: 1920, bitrate: 6_000_000 },
} as const;
export type Rendition = keyof typeof RENDITIONS;
const AUDIO_BITRATE = 128_000;

/** Files at or under this size are already light enough to play smoothly and skip compression. */
export const COMPRESS_ABOVE_BYTES = 8 * 1024 * 1024;

export async function compressVideo(
  file: File,
  rendition: Rendition,
  onProgress: (fraction: number) => void,
): Promise<File | null> {
  const { longEdge, bitrate } = RENDITIONS[rendition];
  if (typeof window === "undefined" || !("VideoEncoder" in window)) return null;
  const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, canEncodeVideo } = await import(
    "mediabunny"
  );
  if (!(await canEncodeVideo("avc"))) return null;

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }), // playback can start before the whole file loads
    target: new BufferTarget(),
  });

  try {
    const conversion = await Conversion.init({
      input,
      output,
      video: async (track) => {
        const width = await track.getDisplayWidth();
        const height = await track.getDisplayHeight();
        const scale = Math.min(1, longEdge / Math.max(width, height));
        return {
          width: Math.round((width * scale) / 2) * 2, // even number of pixels, required by H.264
          codec: "avc",
          bitrate,
          frameRate: 30,
        };
      },
      audio: { bitrate: AUDIO_BITRATE },
      showWarnings: false,
    });
    if (!conversion.isValid) return null;
    conversion.onProgress = (fraction) => onProgress(fraction);
    await conversion.execute();

    const buffer = (output.target as InstanceType<typeof BufferTarget>).buffer;
    if (!buffer) return null;
    const result = new File([buffer], file.name.replace(/\.\w+$/, "") + ".mp4", { type: "video/mp4" });
    // Keep the original if compressing didn't actually help.
    return result.size < file.size ? result : null;
  } catch (error) {
    console.warn("[reels] compression failed, using the original file", error);
    return null;
  } finally {
    input.dispose?.();
  }
}
