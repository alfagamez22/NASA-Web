/**
 * Server-side middleware — enforces auth + onboarding gate on ALL routes.
 *
 * Uses `getToken` from next-auth/jwt to decode the JWT without importing
 * Prisma (which uses Node.js modules incompatible with Edge Runtime).
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_API_PREFIXES = [
  "/api/auth/",          // NextAuth + OTP + onboarding + forgot-password + 2FA
  "/api/audit-log",      // POST for login tracking (fire-and-forget from client)
];

const ONBOARDING_ALLOWED_API = [
  "/api/auth/otp",
  "/api/auth/onboarding",
  "/api/auth/two-factor",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets / Next.js internals — always allow
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webm") ||
    pathname.endsWith(".webmanifest")
  ) {
    return NextResponse.next();
  }

  // Public API routes — always allow
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // ── Not authenticated ──────────────────────────────────────
  if (!token) {
    // API calls → 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes → allow through (AuthGate renders LoginPage client-side)
    return NextResponse.next();
  }

  // ── Authenticated — enforce onboarding gate on API routes ──
  const emailIncomplete = !token.emailVerified;
  const passwordIncomplete =
    !token.passwordChangedAfterCreation && !!token.createdBy;
  const needsOnboarding = emailIncomplete || passwordIncomplete;

  if (needsOnboarding && pathname.startsWith("/api/")) {
    // Allow onboarding-specific API routes through
    if (ONBOARDING_ALLOWED_API.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Account setup required", code: "ONBOARDING_REQUIRED" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
