import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/button-styles";
import { APP } from "@/config/app";
import heroLogo from "../../public/brand/logo-full.png";

const steps = [
  {
    title: "Create your profile",
    body: "Tell us who you are, where you live and what kind of relationship you want. Share only what you are comfortable with.",
  },
  {
    title: "Meet people who fit",
    body: "See people who share your intentions and preferences, with a clear reason why you may be a good fit.",
  },
  {
    title: "Connect when it is mutual",
    body: "When you both like each other, it is a match and a private conversation opens. No mass messaging.",
  },
];

const trust = [
  {
    title: "Honest badges only",
    body: "A verification badge appears only when that check has really been completed. We never fake one.",
  },
  {
    title: "Adults only",
    body: `Everyone on HeartBridge must be ${APP.minimumAge} or older. We check date of birth, not just a tick box.`,
  },
  {
    title: "Your details stay private",
    body: "Your phone number, email and exact location are never shown on your profile.",
  },
];

const matching = [
  "What you are looking for: serious relationship, marriage, dating or friendship",
  "Age, location and lifestyle preferences",
  "Interests, family goals and values",
];

const diaspora = [
  "Live in Liberia? Meet people near you, in your county, or across the country.",
  "Live abroad? Connect with people back home and with Liberians around the world.",
  "You choose where you appear: local, Liberia-wide or diaspora.",
];

const safety = [
  "Block or report anyone, at any time",
  "Reminders to never send money to someone you met online",
  "Reports reviewed by real people",
  "Messaging only between people who have matched",
];

const faqs = [
  {
    q: "Who can join HeartBridge?",
    a: `Anyone who is ${APP.minimumAge} or older and looking for a meaningful connection, in Liberia or anywhere in the world.`,
  },
  {
    q: "Is HeartBridge free?",
    a: "HeartBridge is free to join during our launch. If optional premium features are introduced later, the core experience will stay usable for free.",
  },
  {
    q: "Will other people see my phone number or address?",
    a: "No. We show only an approximate location such as your city and county. Your contact details are never displayed.",
  },
  {
    q: "How does matching work?",
    a: "You like someone. If they like you back, it is a match and you can start chatting. Compatibility is based on what you both tell us, and it is a guide, not a guarantee.",
  },
  {
    q: "What if someone makes me uncomfortable?",
    a: "You can unmatch, block or report them. Reports are reviewed by our team.",
  },
];

function Section({
  id,
  title,
  children,
  tone = "canvas",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  tone?: "canvas" | "surface";
}) {
  return (
    <section
      aria-labelledby={id}
      className={`py-16 ${tone === "surface" ? "bg-surface" : ""}`}
    >
      <div className="mx-auto w-full max-w-5xl px-5">
        <h2 id={id} className="text-3xl font-bold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3 text-lg text-muted">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span aria-hidden className="mt-2.5 size-2 shrink-0 rounded-full bg-gold" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

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
        {/* 1. Hero */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-8 px-5 pb-16 pt-6 sm:pt-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {APP.secondaryTagline}
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Real People.
              <br />
              <span className="text-gold">True Connections.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Connect with people in Liberia and around the world who are looking
              for meaningful relationships.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonStyles.primary}>
                Join HeartBridge
              </Link>
              <a href="#how" className={buttonStyles.secondary}>
                Explore How It Works
              </a>
            </div>
          </div>
          <Image
            src={heroLogo}
            alt="HeartBridge: two people forming a heart over a bridge and the map of Liberia"
            priority
            sizes="(min-width: 768px) 440px, 80vw"
            className="mx-auto h-auto w-4/5 max-w-sm md:w-full md:max-w-md"
          />
        </section>

        {/* 2. How it works */}
        <Section id="how" title="How it works" tone="surface">
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-canvas p-6">
                <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-gold font-bold text-on-gold">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* 3. Trust & verification */}
        <Section id="trust" title="Trust and verification">
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            {trust.map((p) => (
              <div key={p.title} className="border-l-4 border-gold pl-4">
                <dt className="font-bold">{p.title}</dt>
                <dd className="mt-1 text-muted">{p.body}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 4. Meaningful matching */}
        <Section id="matching" title="Meaningful matching" tone="surface">
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Matching goes beyond photographs. We look at what you both say you
            want, and we explain why.
          </p>
          <Bullets items={matching} />
          <p className="mt-6 max-w-2xl text-sm text-muted">
            Compatibility is a guide to help you start conversations. It does
            not predict whether a relationship will succeed.
          </p>
        </Section>

        {/* 5. Liberia + diaspora */}
        <Section id="diaspora" title="Liberia and the diaspora">
          <Bullets items={diaspora} />
        </Section>

        {/* 6. Safety */}
        <Section id="safety" title="Safety comes first" tone="surface">
          <Bullets items={safety} />
          <p className="mt-8">
            <Link href="/safety" className="font-semibold text-gold underline">
              Read our community rules and safety tips
            </Link>
          </p>
        </Section>

        {/* 7. Premium */}
        <Section id="premium" title="Free to join">
          <p className="mt-4 max-w-2xl text-lg text-muted">
            HeartBridge is free to join during our launch. Optional premium
            features may come later, but creating a profile, browsing and
            matching will remain available to everyone.
          </p>
        </Section>

        {/* 8. FAQ */}
        <Section id="faq" title="Questions" tone="surface">
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span aria-hidden className="text-gold transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-2xl text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* 9. Final CTA */}
        <section className="py-20">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-5">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight">
              Ready to meet someone <span className="text-gold">worth meeting?</span>
            </h2>
            <Link href="/signup" className={buttonStyles.primary}>
              Join HeartBridge
            </Link>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-muted">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/safety" className="underline">
              Safety
            </Link>
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            <Link href="/terms" className="underline">
              Terms
            </Link>
            <a href="#how" className="underline">
              How it works
            </a>
            <a href="#faq" className="underline">
              FAQ
            </a>
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </nav>
          <p className="mt-4">
            {APP.tagline} {APP.secondaryTagline}
          </p>
          <p className="mt-1">© {new Date().getFullYear()} {APP.name}</p>
        </div>
      </footer>
    </>
  );
}
