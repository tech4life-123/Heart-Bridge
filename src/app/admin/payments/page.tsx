import Link from "next/link";
import { Card, Notice } from "@/features/admin/components";
import {
  refundPaymentAction,
  reviewPaymentAction,
} from "@/features/admin/actions";
import { FINANCE, requireStaff } from "@/features/admin/guard";
import { PROVIDERS, formatMoney } from "@/features/premium/providers";

const TABS = ["pending", "successful", "failed", "refunded"] as const;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const status = (TABS as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof TABS)[number])
    : "pending";
  const { supabase } = await requireStaff("/admin/payments", FINANCE);
  const { data } = await supabase.rpc("admin_payments_queue", {
    p_status: status,
    p_limit: 50,
  });
  const rows = data ?? [];
  const field = "min-h-11 w-full rounded-xl border-2 bg-surface-2 px-3";
  return (
    <>
      <Notice done={sp.done} error={sp.error} />
      <Card title="Payments">
        <p className="text-sm text-muted">
          Confirm a payment only after you find the same transaction ID, amount
          and sender in the real Orange Money or Lonestar MTN MoMo wallet
          statement. The note is shown to the member, so keep it polite and free
          of private details. You cannot review your own payment.
        </p>
        <nav aria-label="Payment status" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/admin/payments?status=${t}`}
              aria-current={t === status ? "page" : undefined}
              className={`min-h-11 rounded-full border-2 px-4 py-2.5 font-semibold capitalize ${t === status ? "border-gold text-gold" : "border-line"}`}
            >
              {t}
            </Link>
          ))}
        </nav>
        {rows.length === 0 && <p className="text-muted">Nothing here.</p>}
        <ul className="divide-y divide-line">
          {rows.map((p) => (
            <li key={p.id} className="space-y-3 py-4">
              <p>
                <Link
                  href={`/admin/users/${p.user_id}`}
                  className="font-semibold hover:text-gold"
                >
                  {p.first_name}
                </Link>{" "}
                <span className="text-muted">
                  ·{" "}
                  {PROVIDERS[p.provider as keyof typeof PROVIDERS]?.label ??
                    p.provider}{" "}
                  · {formatMoney(p.amount_minor, p.currency)} ·{" "}
                  {p.created_at.slice(0, 16).replace("T", " ")} UTC
                </span>
              </p>
              <p className="text-sm">
                Transaction ID{" "}
                <strong className="font-mono">{p.provider_reference}</strong> ·
                from {p.payer_phone}
              </p>
              {status === "pending" && (
                <form action={reviewPaymentAction} className="space-y-2">
                  <input type="hidden" name="id" value={p.id} />
                  <label
                    htmlFor={`n-${p.id}`}
                    className="block text-sm font-semibold"
                  >
                    Note (optional)
                  </label>
                  <input
                    id={`n-${p.id}`}
                    name="note"
                    maxLength={500}
                    className={field}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      name="decision"
                      value="successful"
                      className="min-h-11 rounded-full border-2 border-success px-5 font-semibold text-success"
                    >
                      Confirmed in wallet
                    </button>
                    <button
                      name="decision"
                      value="failed"
                      className="min-h-11 rounded-full border-2 border-danger px-5 font-semibold text-danger"
                    >
                      Not found / wrong
                    </button>
                  </div>
                </form>
              )}
              {status === "successful" && (
                <form action={refundPaymentAction} className="space-y-2">
                  <input type="hidden" name="id" value={p.id} />
                  <label
                    htmlFor={`r-${p.id}`}
                    className="block text-sm font-semibold"
                  >
                    Refund reason (required)
                  </label>
                  <input
                    id={`r-${p.id}`}
                    name="note"
                    required
                    minLength={5}
                    maxLength={500}
                    className={field}
                  />
                  <button className="min-h-11 rounded-full border-2 border-warning px-5 font-semibold text-warning">
                    Mark refunded (money is returned in the wallet separately)
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
