import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/seed-superadmin — one-time seed (remove after use)
export async function POST() {
  const hash = await bcrypt.hash("harveybuan123", 12);
  const u = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: { passwordHash: hash, role: "super_admin", displayName: "Super Admin" },
    create: { username: "superadmin", passwordHash: hash, displayName: "Super Admin", role: "super_admin" },
  });
  return NextResponse.json({ id: u.id, message: "Super admin seeded" });
}
