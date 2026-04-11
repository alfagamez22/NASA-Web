import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth } from "@/shared/utils/api-helpers";
import crypto from "crypto";

// 2FA SCAFFOLD — TOTP setup/verify/disable
// This implements the data layer. Actual TOTP verification at login
// would require an authenticator library (e.g. otpauth) in a future phase.

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const { action } = (await req.json()) as { action: string };

  if (action === "setup") {
    // Generate a TOTP secret (base32-encoded random bytes)
    const secretBytes = crypto.randomBytes(20);
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < secretBytes.length; i++) {
      secret += base32Chars[secretBytes[i] % 32];
    }

    // Generate backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }

    // Store secret (not yet enabled) so user can scan QR first
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: secret,
        totpBackupCodes: backupCodes,
        // totpEnabled stays false until "enable" action
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const issuer = "SCC-RAN-Portal";
    const otpauthUri = `otpauth://totp/${issuer}:${user?.username}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;

    return NextResponse.json({ secret, backupCodes, otpauthUri });
  }

  if (action === "enable") {
    // In a full implementation, you'd verify a TOTP code here first.
    // For the scaffold, we just flip the flag.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true } });
    if (!user?.totpSecret) {
      return NextResponse.json({ error: "Run setup first" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "disable") {
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "status") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, totpSecret: true },
    });
    return NextResponse.json({
      enabled: user?.totpEnabled ?? false,
      hasSecret: !!user?.totpSecret,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
