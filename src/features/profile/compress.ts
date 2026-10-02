"use client";

import { ACCEPTED_INPUT_TYPES, MAX_DIMENSION, MAX_INPUT_BYTES, MAX_UPLOAD_BYTES, fitWithin } from "./images";

export type CompressedPhoto = { file: File; width: number; height: number };

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resize to at most 1280px and re-encode (WebP, falling back to JPEG) before upload.
 * Saves mobile data and strips EXIF metadata such as GPS. Throws Error(userMessage).
 */
export async function compressPhoto(input: File): Promise<CompressedPhoto> {
  if (!ACCEPTED_INPUT_TYPES.includes(input.type)) {
    throw new Error("Please choose a JPEG, PNG or WebP photo.");
  }
  if (input.size > MAX_INPUT_BYTES) {
    throw new Error("That photo is too large. Please choose one under 15 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that photo. Please try a different one.");
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't prepare photos. Please try another browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55]) {
    let blob = await toBlob(canvas, "image/webp", quality);
    let ext = "webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await toBlob(canvas, "image/jpeg", quality);
      ext = "jpg";
    }
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      return { file: new File([blob], `photo.${ext}`, { type: blob.type }), width, height };
    }
  }
  throw new Error("That photo is still too large after shrinking. Please try a different one.");
}
