/**
 * Minimal middleware — only handles static-asset passthrough.
 *
 * Auth enforcement lives in each API route handler (requireAuth / requireEditor /
 * requireAdmin / requireOnboarded from _helpers.ts).  We removed the getToken()
 * check because it can't reliably read the Auth.js v5 encrypted cookie in
 * Vercel's Edge Runtime, which caused blanket 401s on every API request.
 */
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Only run on API routes (static assets / _next are already excluded)
  matcher: ["/((?!_next/static|_next/image|favicon|images).*)"],
};
