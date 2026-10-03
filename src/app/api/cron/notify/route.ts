import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { emailConfigured, sendEmail } from "@/lib/email/brevo";
import { getPublicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { renderNotification } from "@/features/notifications/templates";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorised(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Sends waiting notification emails. Called every 5 minutes by Supabase pg_cron.
 * Protected by a shared secret; it never claims rows unless email is configured.
 */
async function run(req: Request) {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret || !authorised(req, secret))
    return new NextResponse("Not found", { status: 404 });
  if (!emailConfigured())
    return NextResponse.json({ ok: true, sent: 0, note: "disabled" });

  const env = getPublicEnv();
  const db = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await db.rpc("outbox_claim", {
    p_secret: secret,
    p_limit: 25,
  });
  if (error) {
    logger.error("notify.claim_failed", { code: error.code });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  let sent = 0;
  let failed = 0;
  for (const row of data ?? []) {
    const mail = renderNotification({
      kind: row.kind,
      firstName: row.first_name,
      otherName: row.other_name,
      payload: row.payload,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
    });
    const result = mail
      ? await sendEmail({ to: row.to_email, ...mail })
      : ({ ok: false, error: "unknown_kind" } as const);
    await db.rpc("outbox_finish", {
      p_secret: secret,
      p_id: row.id,
      p_ok: result.ok,
      p_error: result.ok ? undefined : result.error,
    });
    if (result.ok) sent += 1;
    else {
      failed += 1;
      logger.warn("notify.send_failed", {
        kind: row.kind,
        error: result.error,
      });
    }
  }
  return NextResponse.json({ ok: true, sent, failed });
}

export const GET = run;
export const POST = run;
