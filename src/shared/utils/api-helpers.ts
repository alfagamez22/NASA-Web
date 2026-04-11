import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth.config";
import { hasMinRole, outranks, type UserRole } from "@/domains/auth/services/role-hierarchy";
import { prisma } from "@/infrastructure/prisma/client";
import type { Session } from "next-auth";

type AuthResult = { error: NextResponse; session: null } | { error: null; session: Session };

/** Helper to check if the user is authenticated and return the session */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

/**
 * Require the caller to be authenticated AND have completed onboarding.
 * Checks the database for emailVerified and passwordChangedAfterCreation.
 */
export async function requireOnboarded(): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;
  const userId = (result.session!.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, passwordChangedAfterCreation: true, createdBy: true },
  });
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 401 }), session: null };
  }
  if (!user.emailVerified || (!user.passwordChangedAfterCreation && user.createdBy)) {
    return {
      error: NextResponse.json(
        { error: "Account setup required", code: "ONBOARDING_REQUIRED" },
        { status: 403 }
      ),
      session: null,
    };
  }
  return result;
}

/** Require the caller to hold at least `minRole` rank. */
export async function requireRole(minRole: UserRole): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;
  const role = (result.session!.user as { role: string }).role;
  if (!hasMinRole(role, minRole)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return result;
}

/** Helper to check if user has admin, super_admin, or editor role */
export async function requireEditor(): Promise<AuthResult> {
  return requireRole("editor");
}

/** Helper to check if user has admin or super_admin role */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("admin");
}

/** Helper to check if user has super_admin role */
export async function requireSuperAdmin(): Promise<AuthResult> {
  return requireRole("super_admin");
}

/** Verify the caller outranks a target role (for account management). */
export async function requireOutranks(targetRole: string): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;
  const callerRole = (result.session!.user as { role: string }).role;
  if (!outranks(callerRole, targetRole)) {
    return { error: NextResponse.json({ error: "Cannot manage accounts of equal or higher rank" }, { status: 403 }), session: null };
  }
  return result;
}
