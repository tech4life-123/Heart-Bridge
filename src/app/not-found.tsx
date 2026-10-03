import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-5 py-16 text-center">
      <h1 className="text-2xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="text-muted">The link may be old, or the person may no longer be available.</p>
      <Link href="/app" className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-on-gold hover:bg-gold-dark">
        Go to HeartBridge
      </Link>
    </main>
  );
}
