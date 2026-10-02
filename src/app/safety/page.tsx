import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { APP } from "@/config/app";

export const metadata: Metadata = {
  title: "Community rules and safety",
  description:
    "How HeartBridge keeps its community respectful, and how to protect yourself when meeting people online.",
};

const rules = [
  `You must be ${APP.minimumAge} or older. Accounts of anyone under ${APP.minimumAge} are removed.`,
  "Be honest. Use your own photos and real information. Fake profiles are not allowed.",
  "Be respectful. Harassment, hate speech, threats and unwanted sexual messages are not allowed.",
  "No scams. Never ask other members for money, gifts, or financial details.",
  "Respect consent. If someone says no or stops replying, accept it.",
];

const tips = [
  "Never send money to someone you have not met in person, whatever the reason.",
  "Keep personal details (home address, workplace, ID numbers) private until you fully trust someone.",
  "Be cautious if someone moves too fast, avoids video calls, or has a story that keeps changing.",
  "For a first meeting, choose a public place, tell a friend where you are going, and arrange your own transport.",
  "Trust your instincts. You can unmatch, block or report anyone at any time.",
];

export default function SafetyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link href="/" aria-label="HeartBridge home">
        <Logo />
      </Link>
      <h1 className="mt-10 text-4xl font-bold tracking-tight">
        Community rules and safety
      </h1>

      <h2 className="mt-10 text-xl font-bold">Community rules</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-muted marker:text-gold">
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold">Staying safe</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-muted marker:text-gold">
        {tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted">
        If you are in immediate danger, contact your local emergency services.
      </p>
    </main>
  );
}
