import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What HeartBridge collects, why, and the control you have over it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-5 py-8">
      <Link href="/" aria-label="HeartBridge home">
        <Logo />
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy</h1>
      <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        Plain-language summary of how HeartBridge handles your information. It
        should be reviewed by a qualified Liberian lawyer before public launch.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">What we collect</h2>
        <p>
          Account details (email, first name, date of birth), the profile you
          choose to write, your photos, your preferences, your likes and passes,
          matches, and messages with people you matched with. A phone number is
          optional, private, and not verified.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">What other members see</h2>
        <p>
          Only your first name, age, approximate place (never your exact
          location), photos, and the profile details you wrote. Never your
          email, phone number or date of birth.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Who can read your messages</h2>
        <p>
          Only you and the person you matched with. If a conversation is
          reported, our safety team may read that conversation only, and each
          time is recorded in an audit log.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Your controls</h2>
        <p>
          Edit or remove profile details and photos at any time, choose who can
          see you, block and report people, and permanently delete your account
          from Profile. Deleting removes your profile, photos, likes, matches
          and messages.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Payments</h2>
        <p>
          If you buy Premium by Orange Money or Lonestar MTN MoMo, we store the
          transaction ID, the phone number you paid from, the amount and the
          date, so our finance team can check the payment and so you have a
          history. We never see or store your mobile-money PIN.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Optional AI help</h2>
        <p>
          Some features (explaining why two people may suit each other,
          opening-line ideas, bio polishing) use an AI provider, only when you
          tap them. Only the minimum needed is sent: public profile text such as
          a bio and interests, never your name, email, phone number, photos or
          exact location. Our safety team may use an AI summary of a reported
          conversation as a hint, and a person always makes the decision.
          Nothing about AI is required to use HeartBridge.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Safety records</h2>
        <p>
          Reports, warnings and moderation actions are kept to protect members.
          We do not sell your data or show it to advertisers.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Age</h2>
        <p>HeartBridge is only for people aged 18 or over.</p>
      </section>
      <p>
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/safety" className="underline">
          Safety
        </Link>
      </p>
    </main>
  );
}
