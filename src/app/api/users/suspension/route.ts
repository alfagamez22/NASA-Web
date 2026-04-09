import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/_helpers";
import { outranks } from "@/lib/role-hierarchy";
import { logActivity } from "@/lib/activity-logger";

// POST /api/users/suspension — { userId, action: "suspend" | "unsuspend", reason? }
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, action, reason } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const callerRole = (session!.user as { role: string }).role;
  if (!outranks(callerRole, target.role)) {
    return NextResponse.json({ error: "Cannot suspend/unsuspend accounts of equal or higher rank" }, { status: 403 });
  }

  if (action === "suspend") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        suspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason || "Manually suspended by admin",
        suspendedManually: true,
      },
    });
    await logActivity({
      actorId: session!.user.id,
      actionType: "account_suspended",
      targetId: userId,
      metadata: { reason },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "unsuspend") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        suspended: false,
        suspendedAt: null,
        suspendedReason: null,
        suspendedManually: false,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    });
    await logActivity({
      actorId: session!.user.id,
      actionType: "account_unsuspended",
      targetId: userId,
      metadata: {},
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
