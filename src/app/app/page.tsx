import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { CompletionCard } from "@/features/profile/components/CompletionCard";
import { toCompletionInput } from "@/features/profile/bundle";
import { loadMyAnswers, loadQuestions } from "@/features/discovery/queries";
import { getProfileBundle } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Home" };

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const bundle = await getProfileBundle(supabase, user.id);
  if (!bundle) {
    return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;
  }
  // The minimum profile (who you are, what you want, where you live) comes first.
  if (!bundle.profile.onboarding_completed_at) {
    redirect(`/app/onboarding?step=${Math.min(bundle.profile.onboarding_step + 1, 6)}`);
  }

  const [questions, answers] = await Promise.all([loadQuestions(supabase), loadMyAnswers(supabase, user.id)]);
  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {bundle.profile.first_name}.</h1>
      <CompletionCard input={toCompletionInput(bundle)} compact />

      <section className="space-y-3 rounded-3xl border border-line bg-surface p-5">
        <h2 className="text-xl font-bold">Meet someone</h2>
        <p className="text-muted">See people who fit what you are looking for, with a clear reason why.</p>
        <Link href="/app/discover" className={`${buttonStyles.primary} w-full sm:w-auto`}>
          See recommendations
        </Link>
      </section>

      {unanswered > 0 && (
        <section className="space-y-3 rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Improve your recommendations</h2>
          <p className="text-muted">
            {unanswered} quick, optional {unanswered === 1 ? "question" : "questions"} help us explain who suits you.
            Your answers stay private.
          </p>
          <Link href="/app/profile/questions" className={buttonStyles.secondary}>
            Answer questions
          </Link>
        </section>
      )}

      <Alert tone="info">Matching and chat come next. When someone you like likes you back, you will see it here.</Alert>
      <Link href="/app/profile" className={buttonStyles.secondary}>
        View my profile
      </Link>
    </div>
  );
}
