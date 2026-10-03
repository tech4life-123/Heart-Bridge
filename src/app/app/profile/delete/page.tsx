import Link from "next/link";
import type { Metadata } from "next";
import { deleteAccountAction } from "@/features/safety/delete-account";

export const metadata: Metadata = { title: "Delete account" };

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/profile" className="text-muted hover:text-fg">
          ← Profile
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Delete my account
        </h1>
        <p className="mt-1 text-muted">
          This permanently removes your profile, photos, likes, matches and
          messages. It can&apos;t be undone.
        </p>
      </div>
      {error === "review" && (
        <p
          role="alert"
          className="rounded-xl border-2 border-danger/40 bg-danger/10 px-4 py-3 font-medium text-danger"
        >
          Your account can&apos;t be deleted while a safety review is open.
          Please try again once it is finished.
        </p>
      )}
      {error === "failed" && (
        <p
          role="alert"
          className="rounded-xl border-2 border-danger/40 bg-danger/10 px-4 py-3 font-medium text-danger"
        >
          We couldn&apos;t delete your account. Please try again, or contact
          support.
        </p>
      )}
      <form
        action={deleteAccountAction}
        className="space-y-3 rounded-3xl border border-danger/40 bg-surface p-5"
      >
        <label htmlFor="confirm" className="block font-semibold">
          Type DELETE to confirm
        </label>
        <input
          id="confirm"
          name="confirm"
          required
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border-2 bg-surface-2 px-4"
        />
        <button
          type="submit"
          className="min-h-12 w-full rounded-full bg-danger px-6 font-semibold text-white"
        >
          Permanently delete my account
        </button>
      </form>
    </div>
  );
}
