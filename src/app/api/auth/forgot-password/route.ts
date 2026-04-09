import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp, verifyOtp } from "@/lib/otp-engine";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";

// POST /api/auth/forgot-password
// { action: "request", username } — sends OTP to user's email
// { action: "verify", username, code } — verifies the OTP
// { action: "reset", username, code, newPassword } — resets with OTP
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "request") {
    const { username } = body;
    if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { username } });
    // Always return success to prevent username enumeration
    if (!user || !user.email) {
      return NextResponse.json({ success: true, message: "If the account has a verified email, a code has been sent." });
    }
    if (user.suspended) {
      return NextResponse.json({ success: true, message: "If the account has a verified email, a code has been sent." });
    }

    await createAndSendOtp(user.id, user.email, "password_reset");
    await logActivity({
      actorId: user.id,
      actionType: "otp_sent",
      metadata: { purpose: "password_reset" },
    });

    return NextResponse.json({ success: true, message: "If the account has a verified email, a code has been sent." });
  }

  if (body.action === "reset") {
    const { username, code, newPassword } = body;
    if (!username || !code || !newPassword) {
      return NextResponse.json({ error: "Username, code, and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.email) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await verifyOtp(user.id, code, "password_reset");
    if (!result.valid) {
      await logActivity({ actorId: user.id, actionType: "otp_failed", metadata: { purpose: "password_reset" } });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAfterCreation: true,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        // If suspended due to failed logins, unsuspend
        ...(user.suspended && !user.suspendedManually ? {
          suspended: false,
          suspendedAt: null,
          suspendedReason: null,
        } : {}),
      },
    });

    await logActivity({
      actorId: user.id,
      actionType: "password_changed",
      metadata: { viaForgotPassword: true },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
