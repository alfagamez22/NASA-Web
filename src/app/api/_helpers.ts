import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Helper to check if the user is authenticated and return the session */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

/** Helper to check if user has admin, super_admin, or editor role */
export async function requireEditor() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  const role = (session!.user as { role: string }).role;
  if (role !== "admin" && role !== "editor" && role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

/** Helper to check if user has admin or super_admin role */
export async function requireAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  const role = (session!.user as { role: string }).role;
  if (role !== "admin" && role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

/** Helper to check if user has super_admin role */
export async function requireSuperAdmin() {
  const { error, session } = await requireAuth();
  if (error) return { error, session: null };
  const role = (session!.user as { role: string }).role;
  if (role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
