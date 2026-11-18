/**
 * Shrinks a reel in the browser before upload, using Mediabunny (https://mediabunny.dev),
 * which drives the browser's own hardware video encoder (WebCodecs).
 *
 * Output: MP4 (H.264 video + AAC/Opus audio), long edge 1280px (720p vertical), about 3 Mbps.
 * A 60-second phone reel of several hundred MB typically becomes about 20–25 MB.
 *
 * Returns null when the browser can't do it (older browsers, unusual files); the caller then
 * uploads the original if it's within the size limit.
 */
const LONG_EDGE = 1280;
const VIDEO_BITRATE = 3_000_000;
const AUDIO_BITRATE = 128_000;

/** Files at or under this size that are already small enough skip compression. */
export const COMPRESS_ABOVE_BYTES = 25 * 1024 * 1024;

export async function compressVideo(file: File, onProgress: (fraction: number) => void): Promise<File | null> {
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
        const scale = Math.min(1, LONG_EDGE / Math.max(width, height));
        return {
          width: Math.round((width * scale) / 2) * 2, // even number of pixels, required by H.264
          codec: "avc",
          bitrate: VIDEO_BITRATE,
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
