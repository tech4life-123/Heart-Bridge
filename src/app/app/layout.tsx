import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/button-styles";
import { signOutAction } from "@/features/auth/actions";
import { loadUnread } from "@/features/matching/queries";
import { AppealForm } from "@/features/appeals/AppealForm";
import { acknowledgeWarningAction } from "@/features/safety/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // Defence in depth: src/proxy.ts already guards /app, but never rely on one layer.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const [unread, { data: me }, { data: warnings }] = await Promise.all([
    loadUnread(supabase),
    supabase
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_warnings")
      .select("id, message")
      .eq("user_id", user.id)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const restricted =
    me?.account_status === "suspended" || me?.account_status === "banned";
  const appeal = restricted
    ? ((await supabase.rpc("my_appeal")).data ?? [])[0]
    : undefined;

  return (
    <>
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-4">
        <Link href="/app" aria-label="HeartBridge home">
          <Logo />
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className={`${buttonStyles.ghost} !min-h-10 !px-4`}
          >
            Sign out
          </button>
        </form>
      </header>
      {restricted ? (
        <main className="mx-auto w-full max-w-2xl space-y-3 px-5 pb-10 pt-4">
          <h1 className="text-2xl font-extrabold">
            {me?.account_status === "banned"
              ? "This account is no longer available"
              : "Your account is suspended"}
          </h1>
          <p className="text-muted">
            {me?.account_status === "banned"
              ? "This account was removed for breaking the HeartBridge rules."
              : "Your account is paused while our team reviews it. You can't use discovery or chat right now."}{" "}
            If you think this is a mistake, you can appeal below.
          </p>
          {(warnings ?? []).map((w) => (
            <p
              key={w.id}
              className="whitespace-pre-wrap rounded-2xl border-2 border-warning/50 bg-warning/10 p-4"
            >
              {w.message}
            </p>
          ))}
          <section
            aria-labelledby="appeal-title"
            className="space-y-3 rounded-3xl border border-line bg-surface p-5"
          >
            <h2 id="appeal-title" className="text-lg font-bold">
              Appeal
            </h2>
            {appeal?.status === "open" ? (
              <p role="status">
                Your appeal is waiting for review. We will update this page when
                it is decided.
              </p>
            ) : (
              <>
                {appeal && (
                  <p role="status" className="rounded-xl bg-surface-2 p-3">
                    Your last appeal was{" "}
                    {appeal.status === "granted" ? "accepted" : "not accepted"}.
                    {appeal.decision_note
                      ? ` Note from our team: ${appeal.decision_note}`
                      : ""}
                  </p>
                )}
                <AppealForm />
              </>
            )}
          </section>
        </main>
      ) : (
        <>
          <main className="mx-auto w-full max-w-2xl px-5 pb-28 pt-2">
            {(warnings ?? []).map((w) => (
              <form
                key={w.id}
                action={acknowledgeWarningAction}
                className="mb-4 space-y-2 rounded-2xl border-2 border-warning/50 bg-warning/10 p-4"
                role="alert"
              >
                <p className="font-semibold">
                  A message from the HeartBridge team
                </p>
                <p className="whitespace-pre-wrap">{w.message}</p>
                <input type="hidden" name="id" value={w.id} />
                <button
                  type="submit"
                  className="min-h-11 rounded-full border-2 border-warning px-5 font-semibold"
                >
                  I understand
                </button>
              </form>
            ))}
            {children}
          </main>
          <BottomNav
            userId={user.id}
            initialCount={unread.unread + unread.newMatches}
          />
        </>
      )}
    </>
  );
}
