import Link from "next/link";
import type { Metadata } from "next";
import { FeedbackForm } from "@/features/feedback/FeedbackForm";

export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-5">
      <Link
        href="/app/profile"
        className="inline-flex min-h-11 items-center text-gold"
      >
        ‹ My profile
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Feedback</h1>
      <p className="text-muted">
        Tell us what to fix, what to add, or what you like. You do not need to
        be polite or formal. We cannot reply to every message, but we read them
        all.
      </p>
      <FeedbackForm page={sp.from} />
    </div>
  );
}
