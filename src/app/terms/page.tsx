import type { Metadata } from "next";
import Link from "next/link";
import {
  Bullets,
  LegalPage,
  Section,
  SupportContact,
} from "@/components/legal/Legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using HeartBridge.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        By creating an account or using HeartBridge you agree to these terms and
        to our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        . If you do not agree, please do not use the service.
      </p>

      <Section title="1. Who can use HeartBridge">
        <Bullets
          items={[
            "You must be at least 18 years old. Any account that belongs to someone under 18 is removed.",
            "You must be single or otherwise free to date, and you may have only one account.",
            "You must give true information about your name, age and photos, and keep it up to date.",
            "You must not have been removed from HeartBridge before, unless we have restored your account.",
          ]}
        />
      </Section>

      <Section title="2. Your account and security">
        <Bullets
          items={[
            "Keep your password private. You are responsible for activity on your account.",
            "HeartBridge staff will never ask for your password, a sign-in code or your mobile-money PIN. Anyone who does is not from HeartBridge: report them.",
            "Tell us straight away if you think someone else is using your account.",
            "Do not try to break, probe or overload the service, bypass limits, scrape profiles, or access anyone else's data.",
          ]}
        />
      </Section>

      <Section title="3. How to behave">
        <p>Be honest, kind and respectful. You must not:</p>
        <Bullets
          items={[
            "Pretend to be someone else, use another person's photos, or run a fake or misleading profile.",
            "Harass, threaten, stalk, bully or pressure anyone, or send unwanted sexual content or images.",
            "Post hate speech or content that targets people for who they are.",
            "Ask for or send money, gifts, airtime, mobile-money transfers or financial details, or run any scam, romance scam or investment pitch.",
            "Advertise, sell or promote products, services or other websites.",
            "Share another person's private information, photos or messages without their permission.",
            "Post anything illegal, including content involving minors, exploitation or trafficking.",
            "Use HeartBridge for anything other than meeting people for dating and friendship.",
          ]}
        />
      </Section>

      <Section title="4. Safety and meeting people">
        <p>
          We work hard to keep HeartBridge safe, but we cannot check or
          guarantee who anyone is. A profile or badge is not a guarantee. You
          are responsible for your own decisions and meetings. Read our{" "}
          <Link href="/safety" className="underline">
            safety tips
          </Link>
          : meet in a public place, tell a friend, and never send money to
          someone you have not met. Report anything that worries you.
        </p>
      </Section>

      <Section title="5. Your content">
        <p>
          You keep ownership of your photos and words. You give HeartBridge a
          limited, non-exclusive licence to store, display and process them only
          to run the service for you, for example to show your profile to other
          members and deliver your messages. The licence ends when you delete
          the content or your account, apart from copies kept for a short time
          in backups or where a safety review needs them. You promise you have
          the right to share what you upload.
        </p>
      </Section>

      <Section title="6. Premium">
        <Bullets
          items={[
            "Premium costs US$2.00 for 30 days. It does not renew by itself: to continue, you send a new payment.",
            "You pay by Orange Money or Lonestar MTN MoMo to the HeartBridge wallet shown on the Premium page, then enter the transaction ID. Mobile-money fees and exchange rates are set by those providers.",
            "Payments are checked by our team against the real wallet statement. Premium starts when the payment is confirmed, which can take a little while. We do not mark anything paid without checking.",
            "If you paid but Premium has not started, or you paid the wrong amount or twice, contact us with the transaction ID. We consider refunds case by case, and a refund is sent back through the same wallet.",
            "Premium gives you extras such as seeing who liked you and higher daily limits. Safety features, blocking, reporting and messaging matches are never locked behind Premium. Verification badges cannot be bought.",
            "We may change prices or features with notice in the app. A change does not affect the days you have already paid for.",
          ]}
        />
      </Section>

      <Section title="7. Optional AI features">
        <p>
          AI suggestions are provided to help, may be wrong, and are not advice.
          You are responsible for what you send. We limit how often AI features
          can be used each day.
        </p>
      </Section>

      <Section title="8. Moderation, warnings and appeals">
        <p>
          We may warn, limit, suspend or remove accounts or content that break
          these terms, put people at risk, or that we reasonably believe are
          fraudulent, even if no one has reported them. Serious cases, such as
          an account that appears to belong to a minor, a threat, or a scam, may
          be restricted immediately. Every moderation action needs a written
          reason and is recorded. If your account is restricted you can appeal
          from the app, and a person will review it. We may share information
          with the authorities when the law requires or when someone is in
          danger.
        </p>
      </Section>

      <Section title="9. Ending your account">
        <p>
          You can delete your account at any time from Profile. We can end or
          suspend your access if you break these terms. Sections that by their
          nature should continue (such as safety, content rights, limits of
          liability and governing law) continue after your account ends.
        </p>
      </Section>

      <Section title="10. The service as it is">
        <p>
          HeartBridge is provided &quot;as is&quot; and &quot;as
          available&quot;. We do not promise that the service will always work
          without interruption or errors, that you will find a match, or that
          any member is who they say they are. To the fullest extent the law
          allows, HeartBridge is not responsible for what members say or do, for
          meetings between members, or for indirect or consequential losses.
          Nothing in these terms limits liability that cannot be limited by law.
        </p>
      </Section>

      <Section title="11. Disputes and governing law">
        <p>
          These terms are governed by the laws of the Republic of Liberia. We
          would like to solve any problem with you directly first: please
          contact us through <SupportContact />. If we cannot, the courts of
          Liberia can decide it.
        </p>
      </Section>

      <Section title="12. Changes">
        <p>
          We may update these terms. Important changes will be shown in the app.
          If you keep using HeartBridge after a change, you accept the new
          terms. The date at the top shows the latest version.
        </p>
      </Section>
    </LegalPage>
  );
}
