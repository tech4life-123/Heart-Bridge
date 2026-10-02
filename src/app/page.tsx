import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { APP } from "@/config/app";

const steps = [
  {
    title: "Create your profile",
    body: "Tell us who you are and what kind of relationship you are looking for. Share only what you are comfortable with.",
  },
  {
    title: "Meet people who fit",
    body: "Browse people who share your intentions and preferences. Like the ones you are drawn to.",
  },
  {
    title: "Connect when it is mutual",
    body: "When you both like each other, it is a match, and a private conversation opens.",
  },
];

const principles = [
  {
    title: "Adults only",
    body: `Everyone on HeartBridge must be ${APP.minimumAge} or older.`,
  },
  {
    title: "You control your privacy",
    body: "We show your city and region, never your exact location. You decide what others see.",
  },
  {
    title: "Block and report, always one tap away",
    body: "Unmatch, block or report anyone who makes you uncomfortable.",
  },
  {
    title: "Built for real relationships",
    body: "HeartBridge is for people who want something meaningful, not endless scrolling.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="HeartBridge home">
          <Logo />
        </Link>
        <Link href="/login" className={`${buttonStyles.ghost} !min-h-10 !px-4`}>
          Sign in
        </Link>
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:pt-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-rose">
            Dating for Liberia and beyond
          </p>
          <h1 className="max-w-2xl font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {APP.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            HeartBridge helps you meet people who want what you want, and talk
            to them privately and safely.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={buttonStyles.primary}>
              Join HeartBridge
            </Link>
            <Link href="/login" className={buttonStyles.secondary}>
              Sign In
            </Link>
          </div>
        </section>

        <section className="bg-sand/60 py-16" aria-labelledby="how">
          <div className="mx-auto w-full max-w-5xl px-5">
            <h2 id="how" className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-cream p-6">
                  <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-rose font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-16" aria-labelledby="safety">
          <div className="mx-auto w-full max-w-5xl px-5">
            <h2 id="safety" className="text-3xl font-bold tracking-tight">
              Safety and privacy come first
            </h2>
            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {principles.map((p) => (
                <div key={p.title} className="border-l-4 border-gold pl-4">
                  <dt className="font-bold">{p.title}</dt>
                  <dd className="mt-1 text-muted">{p.body}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8">
              <Link href="/safety" className="font-semibold text-rose underline">
                Read our community rules and safety tips
              </Link>
            </p>
          </div>
        </section>

        <section className="bg-ink py-16 text-cream">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-5">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight">
              Ready to meet someone worth meeting?
            </h2>
            <Link href="/signup" className={buttonStyles.primary}>
              Join HeartBridge
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-muted">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/safety" className="underline">
            Safety
          </Link>
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </nav>
        <p className="mt-4">© {new Date().getFullYear()} {APP.name}</p>
      </footer>
    </>
  );
}
