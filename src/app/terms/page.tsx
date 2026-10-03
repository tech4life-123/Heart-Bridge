import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Terms", description: "The rules for using HeartBridge." };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-5 py-8">
      <Link href="/" aria-label="HeartBridge home"><Logo /></Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of use</h1>
      <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        Plain-language draft. It should be reviewed by a qualified Liberian lawyer before public launch.
      </p>
      <ol className="list-decimal space-y-3 pl-5">
        <li>You must be 18 or older. Accounts of anyone under 18 are removed.</li>
        <li>Use your own real photos and information. Fake profiles, impersonation and misleading content are not allowed.</li>
        <li>Be respectful. Harassment, threats, hate speech and unwanted sexual content are not allowed.</li>
        <li>Never ask members for money, gifts or financial details. Scams lead to removal and may be reported to the authorities.</li>
        <li>HeartBridge cannot verify everyone and does not guarantee matches or outcomes. Take care when meeting people: see our <Link href="/safety" className="underline">safety tips</Link>.</li>
        <li>We may warn, restrict, suspend or remove accounts that break these rules. Every moderation action is recorded.</li>
        <li>You can delete your account at any time from Profile.</li>
        <li>These terms may change; important changes will be shown in the app.</li>
      </ol>
      <p><Link href="/privacy" className="underline">Privacy</Link></p>
    </main>
  );
}
