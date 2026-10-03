"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { FINANCE, MODERATION, PEOPLE, SUPER, requireStaff } from "./guard";

const back = z
  .string()
  .regex(/^\/admin[a-z0-9/-]*$/i)
  .catch("/admin");

function go(path: string, result: "done" | "error"): never {
  revalidatePath("/admin", "layout");
  redirect(`${path}?${result === "done" ? "done=1" : "error=1"}`);
}

const moderateSchema = z.object({
  userId: z.uuid(),
  intent: z.enum(["warn", "suspend", "restore", "ban"]),
  reason: z.string().trim().min(5).max(1000),
  back,
});

export async function moderateUserAction(fd: FormData): Promise<void> {
  const parsed = moderateSchema.safeParse(Object.fromEntries(fd));
  const path = back.parse(fd.get("back"));
  if (!parsed.success) go(path, "error");
  const { intent, userId, reason } = parsed.data;
  const { supabase } = await requireStaff(
    path,
    intent === "ban" ? SUPER : MODERATION,
  );
  const { error } =
    intent === "warn"
      ? await supabase.rpc("admin_warn_user", {
          p_user: userId,
          p_message: reason,
        })
      : await supabase.rpc("admin_set_account_status", {
          p_user: userId,
          p_status:
            intent === "suspend"
              ? "suspended"
              : intent === "ban"
                ? "banned"
                : "active",
          p_reason: reason,
        });
  if (error) {
    logger.error("admin.moderate_failed", { code: error.code, intent });
    go(path, "error");
  }
  go(path, "done");
}

const reportSchema = z.object({
  reportId: z.uuid(),
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  note: z.string().trim().max(500).optional(),
});

export async function setReportStatusAction(fd: FormData): Promise<void> {
  const parsed = reportSchema.safeParse({
    reportId: fd.get("reportId"),
    status: fd.get("status"),
    note: (fd.get("note") as string | null) || undefined,
  });
  const path = back.parse(fd.get("back"));
  if (!parsed.success) go(path, "error");
  const { supabase } = await requireStaff(path, MODERATION);
  const { error } = await supabase.rpc("admin_set_report_status", {
    p_id: parsed.data.reportId,
    p_status: parsed.data.status,
    p_note: parsed.data.note,
  });
  if (error) {
    logger.error("admin.report_status_failed", { code: error.code });
    go(path, "error");
  }
  go(path, "done");
}

export async function reviewFlagAction(fd: FormData): Promise<void> {
  const id = z.uuid().safeParse(fd.get("id"));
  const status = z.enum(["reviewed", "dismissed"]).safeParse(fd.get("status"));
  if (!id.success || !status.success) go("/admin/flags", "error");
  const { supabase } = await requireStaff("/admin/flags", MODERATION);
  const { error } = await supabase.rpc("admin_review_flag", {
    p_id: id.data,
    p_status: status.data,
  });
  if (error) {
    logger.error("admin.flag_failed", { code: error.code });
    go("/admin/flags", "error");
  }
  go("/admin/flags", "done");
}

export async function setStaffRoleAction(fd: FormData): Promise<void> {
  const id = z.string().trim().pipe(z.uuid()).safeParse(fd.get("userId"));
  const role = z
    .enum(["moderator", "admin", "support", "finance", "none"])
    .safeParse(fd.get("role"));
  if (!id.success || !role.success) go("/admin/staff", "error");
  const { supabase } = await requireStaff("/admin/staff", SUPER);
  const { error } = await supabase.rpc("admin_set_staff_role", {
    p_user: id.data,
    p_role: role.data === "none" ? undefined : role.data,
  });
  if (error) {
    logger.error("admin.staff_role_failed", { code: error.code });
    go("/admin/staff", "error");
  }
  go("/admin/staff", "done");
}

const paymentSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["successful", "failed"]),
  note: z.string().trim().max(500).optional(),
});

/**
 * Finance confirms (or rejects) a payment AFTER matching the transaction ID and amount against the
 * real wallet statement. Only this action can start Premium; the database re-checks the role and audits it.
 */
export async function reviewPaymentAction(fd: FormData): Promise<void> {
  const parsed = paymentSchema.safeParse({
    id: fd.get("id"),
    decision: fd.get("decision"),
    note: (fd.get("note") as string | null) || undefined,
  });
  const path = "/admin/payments";
  if (!parsed.success) go(path, "error");
  const { supabase } = await requireStaff(path, FINANCE);
  const { error } = await supabase.rpc("admin_review_payment", {
    p_id: parsed.data.id,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) {
    logger.error("admin.payment_review_failed", { code: error.code });
    go(path, "error");
  }
  go(path, "done");
}

const refundSchema = z.object({
  id: z.uuid(),
  note: z.string().trim().min(5).max(500),
});

export async function refundPaymentAction(fd: FormData): Promise<void> {
  const parsed = refundSchema.safeParse({
    id: fd.get("id"),
    note: fd.get("note"),
  });
  const path = "/admin/payments";
  if (!parsed.success) go(path, "error");
  const { supabase } = await requireStaff(path, FINANCE);
  const { error } = await supabase.rpc("admin_refund_payment", {
    p_id: parsed.data.id,
    p_note: parsed.data.note,
  });
  if (error) {
    logger.error("admin.payment_refund_failed", { code: error.code });
    go(path, "error");
  }
  go(path, "done");
}

const appealSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["granted", "denied"]),
  note: z.string().trim().min(5).max(500),
});

/** Decide an appeal. Granting restores the account; lifting a ban needs a Super Admin (checked in the database). */
export async function reviewAppealAction(fd: FormData): Promise<void> {
  const parsed = appealSchema.safeParse(Object.fromEntries(fd));
  const path = "/admin/appeals";
  if (!parsed.success) go(path, "error");
  const { supabase } = await requireStaff(path, MODERATION);
  const { error } = await supabase.rpc("admin_review_appeal", {
    p_id: parsed.data.id,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) {
    logger.error("admin.appeal_review_failed", { code: error.code });
    go(path, "error");
  }
  go(path, "done");
}

const locationSchema = z.object({
  id: z.uuid().optional(),
  parent: z.uuid().optional(),
  kind: z.enum(["country", "region", "city", "community"]),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80),
  sort: z.coerce.number().int().min(0).max(10000).default(0),
  active: z.enum(["on", "off"]).default("on"),
});

/** Add or edit a place (Super Admin). Places are switched off, never removed, so profiles keep valid locations. */
export async function saveLocationAction(fd: FormData): Promise<void> {
  const raw = Object.fromEntries(fd);
  const parsed = locationSchema.safeParse({
    ...raw,
    id: raw.id || undefined,
    parent: raw.parent || undefined,
    active: fd.get("active") === "on" ? "on" : "off",
  });
  const path = "/admin/locations";
  if (!parsed.success) go(path, "error");
  const { supabase } = await requireStaff(path, SUPER);
  const l = parsed.data;
  const { error } = await supabase.rpc("admin_save_location", {
    p_id: (l.id ?? null) as unknown as string,
    p_parent: (l.parent ?? null) as unknown as string,
    p_kind: l.kind,
    p_name: l.name,
    p_slug: l.slug,
    p_sort: l.sort,
    p_active: l.active === "on",
  });
  if (error) {
    logger.error("admin.location_save_failed", { code: error.code });
    go(path, "error");
  }
  go(path, "done");
}

const feedbackSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "reviewed", "done"]),
  tab: z.enum(["new", "reviewed", "done"]).default("new"),
});

export async function setFeedbackStatusAction(fd: FormData): Promise<void> {
  const parsed = feedbackSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) go("/admin/feedback", "error");
  const path = `/admin/feedback?status=${parsed.data.tab}`;
  const { supabase } = await requireStaff("/admin/feedback", PEOPLE);
  const { error } = await supabase.rpc("admin_set_feedback_status", {
    p_id: parsed.data.id,
    p_status: parsed.data.status,
  });
  if (error) {
    logger.error("admin.feedback_status_failed", { code: error.code });
    go("/admin/feedback", "error");
  }
  revalidatePath("/admin", "layout");
  redirect(path);
}
