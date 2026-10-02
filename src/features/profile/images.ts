/** Shared (client + server) image rules. The server re-checks everything. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // matches the storage bucket limit
export const MAX_INPUT_BYTES = 15 * 1024 * 1024; // before client-side compression
export const MAX_DIMENSION = 1280;
export const ACCEPTED_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type SniffedType = "jpeg" | "png" | "webp";

/** Identify an image by its magic bytes, never by file name or declared MIME type. */
export function sniffImageType(bytes: Uint8Array): SniffedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

/** Scale (width, height) down so the longest side is at most `max`. Never upscales. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
