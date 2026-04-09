import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasMinRole, outranks, type UserRole } from "@/lib/role-hierarchy";
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
