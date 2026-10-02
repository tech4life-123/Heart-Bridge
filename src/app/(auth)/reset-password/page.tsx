import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // Only reachable with the session created by a valid recovery link.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=link_expired");

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Choose a new password</h1>
      <p className="mb-6 text-muted">Pick something you have not used before.</p>
      <ResetPasswordForm />
    </>
  );
}
