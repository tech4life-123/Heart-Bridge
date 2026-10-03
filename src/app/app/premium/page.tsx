import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { cancelPaymentAction } from "@/features/premium/actions";
import {
  PaymentForm,
  type WalletOption,
} from "@/features/premium/components/PaymentForm";
import {
  PROVIDERS,
  CARD_NOTICE,
  PREMIUM_PRICE_LABEL,
  formatMoney,
  isProviderId,
} from "@/features/premium/providers";
import { getEntitlements } from "@/features/premium/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Premium" };

const STATUS: Record<string, string> = {
  pending: "Waiting to be checked",
  successful: "Confirmed",
  failed: "Could not be confirmed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function PremiumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/premium");

  const [ent, optionsRes, historyRes] = await Promise.all([
    getEntitlements(supabase),
    supabase.rpc("payment_options"),
    supabase
      .from("payments")
      .select(
        "id, provider, provider_reference, amount_minor, currency, status, review_note, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const options: WalletOption[] = (optionsRes.data ?? []).flatMap((o) =>
    isProviderId(o.provider)
      ? [
          {
            provider: o.provider,
            wallet: o.wallet_number,
            accountName: o.account_name,
          },
        ]
      : [],
  );
  const history = historyRes.data ?? [];
  const pending = history.find((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Premium</h1>

      {ent.isPremium && (
        <p
          role="status"
          className="rounded-2xl border-2 border-gold bg-surface p-4 font-semibold"
        >
          Premium is on until{" "}
          {ent.premiumUntil
            ? new Date(ent.premiumUntil).toISOString().slice(0, 10)
            : "your renewal date"}
          .
        </p>
      )}

      <section className="space-y-3 rounded-3xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">{PREMIUM_PRICE_LABEL}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>See who liked you.</li>
          <li>More daily likes (500 instead of 50).</li>
          <li>More AI help (50 a day instead of 10).</li>
        </ul>
        <p className="text-sm text-muted">
          Safety and messaging are never locked behind Premium. Verification
          badges are not for sale: they are only given after real checks.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">
          {ent.isPremium ? "Renew" : "Get Premium"}
        </h2>
        {pending ? (
          <div className="space-y-3">
            <p>
              Your payment{" "}
              {PROVIDERS[pending.provider as keyof typeof PROVIDERS]?.label ??
                ""}{" "}
              <strong>{pending.provider_reference}</strong> is waiting to be
              checked. This is done by our team, so it can take a little while.
            </p>
            <form action={cancelPaymentAction}>
              <input type="hidden" name="id" value={pending.id} />
              <button className="min-h-11 rounded-full border-2 border-line px-5 font-semibold hover:border-gold">
                Cancel and fix a mistake
              </button>
            </form>
          </div>
        ) : options.length === 0 ? (
          <p className="text-muted">
            Payments are opening soon. Please check back shortly.
          </p>
        ) : (
          <PaymentForm options={options} price={PREMIUM_PRICE_LABEL} />
        )}
        <p className="text-sm text-muted">
          {CARD_NOTICE} We never ask for your PIN or password, and we never ask
          you to send money to another person.
        </p>
      </section>

      {history.length > 0 && (
        <section className="space-y-2 rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Payment history</h2>
          <ul className="divide-y divide-line">
            {history.map((p) => (
              <li key={p.id} className="py-3 text-sm">
                <p className="font-semibold">
                  {formatMoney(p.amount_minor, p.currency)} ·{" "}
                  {PROVIDERS[p.provider as keyof typeof PROVIDERS]?.label ??
                    p.provider}
                </p>
                <p className="text-muted">
                  {STATUS[p.status] ?? p.status} · {p.provider_reference} ·{" "}
                  {p.created_at.slice(0, 10)}
                </p>
                {p.review_note && p.status !== "pending" && (
                  <p className="text-muted">Note: {p.review_note}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-sm text-muted">
        Questions? See our{" "}
        <Link href="/terms" className="text-gold">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-gold">
          privacy notice
        </Link>
        .
      </p>
    </div>
  );
}
