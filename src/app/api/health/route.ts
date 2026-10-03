import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness check for uptime monitors. Reveals nothing about configuration or data. */
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
