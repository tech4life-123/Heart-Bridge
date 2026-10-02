"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { deletePhotoAction, makeMainPhotoAction, uploadPhotoAction } from "../actions";
import { compressPhoto } from "../compress";
import { LIMITS } from "../constants";
import type { PhotoWithUrl } from "../queries";
import { initialFormState } from "../types";

function PhotoTile({ photo, index }: { photo: PhotoWithUrl; index: number }) {
  const [delState, del, deleting] = useActionState(deletePhotoAction, initialFormState);
  const [mainState, makeMain, setting] = useActionState(makeMainPhotoAction, initialFormState);
  const error = delState.error ?? mainState.error;
  return (
    <li className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2">
        {photo.url ? (
          // Signed, short-lived URL to a private bucket: next/image optimisation can't be used here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={`Your photo ${index + 1}`}
            width={photo.width ?? 480}
            height={photo.height ?? 640}
            loading="lazy"
            decoding="async"
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center p-2 text-center text-sm text-muted">
            Photo unavailable
          </div>
        )}
        {index === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-on-gold">
            Main photo
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {index !== 0 && (
          <form action={makeMain} className="flex-1">
            <input type="hidden" name="photo_id" value={photo.id} />
            <button
              type="submit"
              disabled={setting || deleting}
              className="min-h-11 w-full rounded-xl border-2 border-line px-2 text-sm font-semibold hover:border-gold hover:text-gold disabled:opacity-60"
            >
              {setting ? "Saving…" : "Make main"}
            </button>
          </form>
        )}
        <form action={del} className="flex-1">
          <input type="hidden" name="photo_id" value={photo.id} />
          <button
            type="submit"
            disabled={deleting || setting}
            aria-label={`Remove photo ${index + 1}`}
            className="min-h-11 w-full rounded-xl border-2 border-line px-2 text-sm font-semibold text-danger hover:border-danger disabled:opacity-60"
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </form>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </li>
  );
}

export function PhotoManager({ photos }: { photos: PhotoWithUrl[] }) {
  const [state, upload, uploading] = useActionState(uploadPhotoAction, initialFormState);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const full = photos.length >= LIMITS.photos;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setLocalError(null);
    setPreparing(true);
    try {
      const { file: small, width, height } = await compressPhoto(file);
      const fd = new FormData();
      fd.set("photo", small);
      fd.set("width", String(width));
      fd.set("height", String(height));
      startTransition(() => upload(fd));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "We couldn't read that photo.");
    } finally {
      setPreparing(false);
    }
  }

  const busy = preparing || uploading;
  const message = localError ?? state.error;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Add up to {LIMITS.photos} clear photos of yourself. Photos are shrunk on your phone before upload to save data.
        Your first photo is your main photo.
      </p>
      {message && <Alert tone="error">{message}</Alert>}
      {state.success && !message && state.message && <Alert tone="success">{state.message}</Alert>}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((p, i) => <PhotoTile key={p.id} photo={p} index={i} />)}
        </ul>
      )}

      <div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          className="sr-only"
          id="photo-input"
          disabled={busy || full}
        />
        <label
          htmlFor="photo-input"
          className={`inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gold px-6 text-base font-semibold text-gold hover:bg-gold/10 sm:w-auto ${
            busy || full ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {busy ? "Uploading…" : full ? "Photo limit reached" : photos.length === 0 ? "Add your first photo" : "Add another photo"}
        </label>
      </div>
    </div>
  );
}
