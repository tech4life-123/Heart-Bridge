import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { logger } from "@/lib/logger";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "recovery",
  "email",
  "magiclink",
  "email_change",
  "invite",
];

/**
 * Landing point for links in Supabase emails (confirm email, reset password).
 * Supports both link styles:
 *  - `code`: the default PKCE flow used with Supabase's standard email templates
 *  - `token_hash` + `type`: custom templates
 * Verifies the one-time credential, creates the session, then redirects safely.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    logger.warn("auth.code_exchange_failed", { code: error.code, status: error.status });
  } else if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    logger.warn("auth.confirm_failed", { code: error.code, status: error.status });
  }

  return NextResponse.redirect(new URL("/login?error=link_expired", origin));
}
