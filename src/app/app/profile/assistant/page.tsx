import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { requireOnboarded } from "@/features/discovery/context";
import { BioAssistant } from "@/features/ai/components/BioAssistant";

export const metadata: Metadata = { title: "Bio helper" };

export default async function AssistantPage() {
  const { bundle } = await requireOnboarded("/app/profile/assistant");
  if (!bundle)
    return (
      <Alert tone="error">
        We couldn&apos;t load your profile. Please refresh the page.
      </Alert>
    );
  return (
    <div className="space-y-5">
      <Link
        href="/app/profile"
        className="inline-flex min-h-11 items-center text-gold"
      >
        ‹ My profile
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Bio helper</h1>
      <p className="text-muted">
        Optional AI help to polish your bio. Only the text in the box below is
        sent to our AI provider: no name, photos or contact details. You are
        never required to use it.
      </p>
      <BioAssistant initialBio={bundle.profile.bio ?? ""} />
    </div>
  );
}
