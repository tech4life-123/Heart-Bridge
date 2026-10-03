import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export const LEGAL_UPDATED = "3 October 2026";

/** Shown only when the owner sets NEXT_PUBLIC_SUPPORT_EMAIL, so we never print a made-up address. */
export function SupportContact() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return email ? (
    <a className="underline" href={`mailto:${email}`}>
      {email}
    </a>
  ) : (
    <span>the support contact shown in the app and on our website</span>
  );
}

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-5 py-8">
      <Link href="/" aria-label="HeartBridge home">
        <Logo />
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
      <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        This is written in plain language so you can understand it. It should be
        reviewed by a qualified Liberian lawyer before public launch.
      </p>
      {children}
      <nav
        aria-label="Legal"
        className="flex flex-wrap gap-4 border-t border-line pt-4"
      >
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="underline">
          Terms of Use
        </Link>
        <Link href="/safety" className="underline">
          Safety tips
        </Link>
      </nav>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
