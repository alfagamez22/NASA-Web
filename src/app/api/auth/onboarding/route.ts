import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_helpers";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";

// POST /api/auth/onboarding — { action: "change-password", currentPassword, newPassword }
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const body = await req.json();

  if (body.action === "change-password") {
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: "Password must contain at least 1 uppercase letter" }, { status: 400 });
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password must contain at least 1 number" }, { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json({ error: "Password must contain at least 1 special character" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Don't allow reusing the same password
    const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAfterCreation: true },
    });

    await logActivity({
      actorId: userId,
      actionType: "password_changed",
      metadata: { selfChange: true },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
