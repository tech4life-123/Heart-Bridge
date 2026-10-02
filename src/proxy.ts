import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Routes that require a signed-in user. Pages ALSO re-check on the server. */
const PROTECTED_PREFIXES = ["/app"];
/** Routes a signed-in user has no reason to visit. */
const GUEST_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"];

function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  search = "",
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  const redirect = NextResponse.redirect(url);
  // Preserve refreshed session cookies on the redirect response.
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isProtected && !user) {
    const next = encodeURIComponent(pathname + request.nextUrl.search);
    return redirectWithSession(request, response, "/login", `?next=${next}`);
  }

  if (user && GUEST_ONLY_ROUTES.includes(pathname)) {
    return redirectWithSession(request, response, "/app");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.svg|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
