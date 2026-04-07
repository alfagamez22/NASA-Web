import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireSuperAdmin } from "@/app/api/_helpers";

// GET /api/audit-log — super_admin can view login/logout history
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "200", 10);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 1000),
  });

  return NextResponse.json(logs);
}

// POST /api/audit-log — record a login/logout event
export async function POST(req: NextRequest) {
  const body = await req.json();

  const log = await prisma.auditLog.create({
    data: {
      action: body.action, // "login" | "logout"
      userId: body.userId,
      username: body.username,
      userRole: body.userRole,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

// DELETE /api/audit-log — super_admin can clear all audit logs
export async function DELETE(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  await prisma.auditLog.deleteMany({});

  return NextResponse.json({
    success: true,
    message: "All audit logs have been cleared.",
  });
}
