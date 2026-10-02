import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

// Account pages must never appear in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/" aria-label="HeartBridge home" className="mb-8 self-start">
        <Logo />
      </Link>
      <div className="rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        {children}
      </div>
    </main>
  );
}
