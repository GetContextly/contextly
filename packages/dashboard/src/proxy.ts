import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/config";
import { ROUTES } from "@/lib/constants";

const PROTECTED_PREFIXES = [ROUTES.me, ROUTES.admin, ROUTES.dashboard] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  const response = isProtected(pathname)
    ? handleProtected(request, pathname, search)
    : NextResponse.next();

  // SECURITY HEADERS (CSEC-001)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

function handleProtected(request: NextRequest, pathname: string, search: string) {
  const session = request.cookies.get(SESSION_COOKIE);
  if (session?.value) {
    return NextResponse.next();
  }

  const loginUrl = new URL(ROUTES.login, request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
