"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Technical details stay in the logs; the person only sees a friendly message.
    console.error("ui.error", error.digest);
  }, [error]);
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-5 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="text-muted">Please try again. If it keeps happening, check your connection or come back in a few minutes.</p>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => retry()} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-on-gold hover:bg-gold-dark">
          Try again
        </button>
        <Link href="/" className="min-h-12 rounded-full border-2 border-line px-6 py-3 font-semibold hover:border-gold">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
