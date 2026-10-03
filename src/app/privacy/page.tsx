import type { Metadata } from "next";
import Link from "next/link";
import {
  Bullets,
  LegalPage,
  Section,
  SupportContact,
} from "@/components/legal/Legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What HeartBridge collects, why, how we protect it, and the control you have over it.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <Section title="The short version">
        <Bullets
          items={[
            "We collect only what a dating service needs to work and to keep people safe.",
            "Other members never see your email, phone number, date of birth or exact location.",
            "We do not sell your data and we do not show it to advertisers.",
            "Your messages are private to you and the person you matched with. Staff may read a conversation only when it has been reported, and each time is recorded.",
            "We never ask for your password, mobile-money PIN or bank details.",
            "You can edit, hide or permanently delete your information.",
          ]}
        />
      </Section>

      <Section title="Who we are">
        <p>
          HeartBridge is a dating service for adults in Liberia and the Liberian
          diaspora. In this policy &quot;we&quot; means HeartBridge. You can
          reach us through <SupportContact />.
        </p>
      </Section>

      <Section title="What we collect">
        <Bullets
          items={[
            <span key="a">
              <strong>Account:</strong> email address, a password (stored only
              as a one-way hash by our sign-in provider, never readable by us),
              first name and date of birth. You must be 18 or older.
            </span>,
            <span key="b">
              <strong>Profile you choose to write:</strong> bio, work and
              education, languages, lifestyle answers, interests, what you are
              looking for, the area you live in (region or city, never an exact
              address), and compatibility answers. The compatibility answers are
              private and only used to calculate a match score.
            </span>,
            <span key="c">
              <strong>Photos:</strong> stored privately. They are shown only to
              people who are allowed to see your profile, through short-lived
              links.
            </span>,
            <span key="d">
              <strong>Activity:</strong> likes, passes, saved profiles, matches,
              messages, blocks and reports, because the service cannot work
              without them.
            </span>,
            <span key="e">
              <strong>Optional phone number:</strong> private and not verified.
              It is never shown to other members.
            </span>,
            <span key="f">
              <strong>Payments:</strong> if you buy Premium, the transaction ID,
              the phone number you paid from, the amount, the date and the
              result of our check.
            </span>,
            <span key="g">
              <strong>Technical and security data:</strong> basic request and
              error logs and rate-limit counters, used to keep the service
              running and to stop abuse.
            </span>,
          ]}
        />
        <p>
          We do not collect your exact location, contacts, microphone or camera
          roll. We do not ask for religion, tribe, ethnicity, health or
          immigration status.
        </p>
      </Section>

      <Section title="Why we use it">
        <Bullets
          items={[
            "To create your account and show you suitable people (matching rules use only what you choose to share).",
            "To let matched people message each other and to tell you about new matches and messages.",
            "To keep members safe: reports, blocks, scam-pattern hints, warnings, suspensions and appeals.",
            "To check Premium payments and switch Premium on.",
            "To secure and improve the service, and to meet legal obligations.",
          ]}
        />
        <p>
          We do not use your private messages to build advertising profiles, and
          we do not train AI models on your data.
        </p>
      </Section>

      <Section title="Who can see what">
        <Bullets
          items={[
            <span key="a">
              <strong>Other members:</strong> first name, age, approximate
              place, photos and the profile details you wrote. Never your email,
              phone number, date of birth or exact location.
            </span>,
            <span key="b">
              <strong>Matched people:</strong> your messages to them.
            </span>,
            <span key="c">
              <strong>Our staff:</strong> only what their role needs. Moderators
              can review reports and profiles. Reading a reported conversation
              is a deliberate action limited to that conversation and is written
              to a permanent audit log. Finance staff see payment details.
              Support staff can look people up by name or exact email. Staff
              cannot see your password.
            </span>,
            <span key="d">
              <strong>The person you report or block:</strong> they are never
              told who reported or blocked them.
            </span>,
          ]}
        />
      </Section>

      <Section title="Service providers who handle data for us">
        <Bullets
          items={[
            "Supabase: database, sign-in and photo storage.",
            "Vercel: hosting of the website and app.",
            "Our AI provider (only when you tap an AI feature, or when a moderator uses the optional safety summary): see below.",
            "Orange Money and Lonestar MTN MoMo move the money themselves under their own rules. We receive only the details you type in.",
          ]}
        />
        <p>
          These providers process data on our behalf and may store it on servers
          outside Liberia. We share data with the police or courts only when the
          law requires it or when someone&apos;s safety is at serious risk, and
          we limit it to what is needed.
        </p>
      </Section>

      <Section title="Optional AI help">
        <p>
          Features such as explaining why two people may suit each other,
          opening-line ideas and bio polishing use an AI provider, only when you
          choose them. We send the minimum needed: profile text such as a bio
          and interests, never your name, email, phone number, photos or exact
          location. For safety, a moderator may use an AI summary of a reported
          conversation as a hint, and a human always makes the decision. AI
          output can be wrong, so check it before you rely on it. You never need
          AI to use HeartBridge.
        </p>
      </Section>

      <Section title="How we protect your information">
        <Bullets
          items={[
            "Data is encrypted in transit (HTTPS) and our hosting providers encrypt it at rest.",
            "Every database table has access rules that are enforced by the database itself, so one member cannot read another member's private data even if the app had a bug.",
            "Photos are in private storage and shown only through short-lived links.",
            "Staff roles are limited, checked by the database on every action, and every staff action is written to an append-only audit log.",
            "Sign-in, messages, reports, likes and payments have rate limits to slow down abuse and automated attacks.",
            "The app sends strict security headers, validates all input on the server, and never shows technical error details to members.",
            "Secret keys are kept on the server and never sent to your device.",
          ]}
        />
        <p>
          No system is perfectly secure. If a breach affects your information we
          will tell the people affected and act quickly to contain it. Please
          use a strong, unique password, and never share it or any code with
          anyone, including people who say they work for HeartBridge. We will
          never ask for it.
        </p>
        <p>
          If you find a security problem, please tell us through{" "}
          <SupportContact /> and give us reasonable time to fix it. Please do
          not access other people&apos;s data or disrupt the service while
          testing.
        </p>
      </Section>

      <Section title="How long we keep it">
        <Bullets
          items={[
            "Your profile, photos, likes, matches and messages are kept while your account is active.",
            "If you delete your account, your profile, photos, likes, matches and messages are removed. A conversation you delete from your own view disappears for you only; the other person keeps theirs.",
            "Where a safety review is still open, deletion is paused until it is finished so evidence is not lost.",
            "Audit logs, and records we are legally required to keep, are kept only as long as needed for those purposes.",
          ]}
        />
      </Section>

      <Section title="Your choices and rights">
        <Bullets
          items={[
            "See and change your profile, photos, interests and preferences at any time.",
            "Block and report people, and see who you have blocked.",
            "Ask us for a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it, through Profile or by contacting us.",
            "Appeal if your account is restricted. A person reviews every appeal.",
            "Delete your account permanently from Profile.",
          ]}
        />
      </Section>

      <Section title="Cookies and similar technology">
        <p>
          We use only the essential cookies and storage needed to keep you
          signed in and to remember basic settings. We do not use advertising or
          cross-site tracking cookies.
        </p>
      </Section>

      <Section title="Children">
        <p>
          HeartBridge is for people aged 18 or over. If we learn that someone is
          under 18 we remove the account. If you believe a member is under 18,
          report their profile and our team will treat it as urgent.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We will update this page when our practices change and show important
          changes in the app. The date at the top shows the latest version. Our{" "}
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>{" "}
          also apply.
        </p>
      </Section>
    </LegalPage>
  );
}
