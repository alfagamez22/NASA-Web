/**
 * OTP Engine (F4)
 *
 * Generates 6-digit OTP codes, stores bcrypt hashes in EmailOtpToken,
 * and validates them with attempt counting + expiry checking.
 */
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email-service";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;

/** Generate a cryptographically random 6-digit OTP string. */
function generateOtp(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(randomInt(min, max + 1));
}

/**
 * Create and send an OTP for the given user + email.
 * Invalidates any previous unexpired tokens of the same type.
 */
export async function createAndSendOtp(
  userId: string,
  email: string,
  tokenType: "email_verification" | "password_reset"
): Promise<{ success: boolean; error?: string }> {
  // Rate-limit: max 5 OTPs per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.emailOtpToken.count({
    where: { userId, tokenType, emailUsed: email, createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= 5) {
    return { success: false, error: "Too many OTP requests. Please wait before trying again." };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  // Mark any old tokens of the same type as consumed
  await prisma.emailOtpToken.updateMany({
    where: { userId, tokenType, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailOtpToken.create({
    data: {
      userId,
      otpHash,
      emailUsed: email,
      tokenType,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  await sendOtpEmail(
    email,
    otp,
    tokenType === "email_verification" ? "verification" : "password_reset"
  );

  return { success: true };
}

/**
 * Verify an OTP code. Returns the token record on success.
 */
export async function verifyOtp(
  userId: string,
  code: string,
  tokenType: "email_verification" | "password_reset"
): Promise<{ valid: boolean; error?: string }> {
  const token = await prisma.emailOtpToken.findFirst({
    where: {
      userId,
      tokenType,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    return { valid: false, error: "No valid OTP found. Please request a new code." };
  }

  const matches = await bcrypt.compare(code, token.otpHash);

  if (!matches) {
    await prisma.emailOtpToken.update({
      where: { id: token.id },
      data: { attemptCount: token.attemptCount + 1 },
    });
    return { valid: false, error: "Incorrect code. Please try again." };
  }

  // Mark as consumed
  await prisma.emailOtpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  return { valid: true };
}
