"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GENERIC_ERROR } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { isProviderId, parseAmountToMinor } from "./providers";

export type PaymentState = { ok?: boolean; error?: string };

const schema = z.object({
  provider: z.string().refine(isProviderId, "provider"),
  reference: z.string().trim().min(6).max(40),
  phone: z.string().trim().min(7).max(20),
  amount: z.string(),
  currency: z.enum(["USD", "LRD"]),
});

/**
 * Records that the member says they paid. This does NOT grant Premium: finance staff verify the
 * reference against the real wallet statement first (see admin_review_payment).
 */
export async function submitPaymentAction(
  _prev: PaymentState,
  fd: FormData,
): Promise<PaymentState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  const minor = parsed.success ? parseAmountToMinor(parsed.data.amount) : null;
  if (!parsed.success || minor === null) {
    return {
      error:
        "Please check the transaction ID (6 to 40 letters or numbers), your phone number and the amount.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/premium");

  const { error } = await supabase.rpc("submit_payment", {
    p_provider: parsed.data.provider as "orange_money" | "lonestar_momo",
    p_reference: parsed.data.reference,
    p_phone: parsed.data.phone,
    p_amount_minor: minor,
    p_currency: parsed.data.currency,
  });
  if (error) {
    const m = error.message ?? "";
    if (m.includes("provider_unavailable"))
      return {
        error:
          "This payment method isn't open yet. Please try another one later.",
      };
    if (m.includes("invalid_payment"))
      return {
        error:
          "Please check the transaction ID (6 to 40 letters or numbers), your phone number and the amount.",
      };
    if (m.includes("payment_pending"))
      return {
        error:
          "You already have a payment waiting to be checked. Please wait for it, or cancel it first.",
      };
    if (m.includes("rate_limited"))
      return {
        error:
          "You have sent several payments today. Please try again tomorrow, or contact support.",
      };
    if (m.includes("reference_used"))
      return {
        error: "That transaction ID has already been used. Please check it.",
      };
    logger.error("premium.submit_failed", { code: error.code });
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/app/premium");
  return { ok: true };
}

export async function cancelPaymentAction(fd: FormData): Promise<void> {
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) redirect("/app/premium");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/premium");
  const { error } = await supabase.rpc("cancel_my_payment", { p_id: id.data });
  if (error) logger.error("premium.cancel_failed", { code: error.code });
  revalidatePath("/app/premium");
  redirect("/app/premium");
}
