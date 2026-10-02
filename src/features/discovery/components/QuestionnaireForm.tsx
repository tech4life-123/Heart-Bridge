"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Choice } from "@/components/ui/Choice";
import { SubmitButton } from "@/components/ui/Button";
import { saveAnswersAction } from "../actions";
import type { Question } from "../queries";
import { initialFormState } from "@/features/profile/types";

/** Short, optional, skippable. Answers are private; only an overall similarity number is ever used. */
export function QuestionnaireForm({ questions, answers }: { questions: Question[]; answers: Record<string, number> }) {
  const [state, action] = useActionState(saveAnswersAction, initialFormState);

  return (
    <form action={action} className="space-y-6">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && state.message && <Alert tone="success">{state.message}</Alert>}

      {questions.map((q) => (
        <fieldset key={q.id} className="space-y-2">
          <legend className="text-base font-semibold">{q.prompt}</legend>
          <div className="grid gap-2">
            {q.options.map((o) => (
              <Choice key={o.value} type="radio" name={`q_${q.id}`} value={String(o.value)} defaultChecked={answers[q.id] === o.value}>
                {o.label}
              </Choice>
            ))}
          </div>
        </fieldset>
      ))}

      <SubmitButton pendingText="Saving…">Save my answers</SubmitButton>
    </form>
  );
}
