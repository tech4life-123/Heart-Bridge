import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { QuestionnaireForm } from "@/features/discovery/components/QuestionnaireForm";
import { requireOnboarded } from "@/features/discovery/context";
import { loadMyAnswers, loadQuestions } from "@/features/discovery/queries";

export const metadata: Metadata = { title: "Compatibility questions" };

export default async function QuestionsPage() {
  const { supabase, user, bundle } = await requireOnboarded("/app/profile/questions");
  if (!bundle) return <Alert tone="error">We couldn&apos;t load your account. Please refresh the page.</Alert>;

  const [questions, answers] = await Promise.all([loadQuestions(supabase), loadMyAnswers(supabase, user.id)]);

  return (
    <div className="space-y-6">
      <Link href="/app/profile" className="inline-flex min-h-11 items-center text-gold">
        ‹ My profile
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Compatibility questions</h1>
        <p className="mt-1 text-muted">
          Six quick, optional questions. Your answers are private: other people never see them. We only use how closely
          your answers line up with someone else&apos;s to improve your recommendations.
        </p>
      </div>
      {questions.length === 0 ? (
        <Alert tone="info">There are no questions right now. Please check back later.</Alert>
      ) : (
        <QuestionnaireForm questions={questions} answers={answers} />
      )}
    </div>
  );
}
