import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/shared/utils/api-helpers";
import { createAndSendOtp, verifyOtp } from "@/domains/auth/services/otp.service";
import { prisma } from "@/infrastructure/prisma/client";
import { logActivity } from "@/infrastructure/logging/activity-logger";

// POST /api/auth/otp — { action: "send" | "verify", email?, code?, tokenType }
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const body = await req.json();
  const { action, email, code, tokenType } = body;

  if (action === "send") {
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const type = tokenType === "password_reset" ? "password_reset" as const : "email_verification" as const;
    const result = await createAndSendOtp(userId, email, type);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    await logActivity({ actorId: userId, actionType: "otp_sent", metadata: { email, tokenType: type } });
    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "OTP code is required" }, { status: 400 });
    }

    const type = tokenType === "password_reset" ? "password_reset" as const : "email_verification" as const;
    const result = await verifyOtp(userId, code, type);

    if (!result.valid) {
      await logActivity({ actorId: userId, actionType: "otp_failed", metadata: { tokenType: type } });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity({ actorId: userId, actionType: "otp_verified", metadata: { tokenType: type } });

    // If this was email verification, mark the user's email as verified
    if (type === "email_verification" && email) {
      await prisma.user.update({
        where: { id: userId },
        data: { email, emailVerified: true },
      });
      await logActivity({ actorId: userId, actionType: "email_verified", metadata: { email } });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
