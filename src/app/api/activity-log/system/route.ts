import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/app/api/_helpers";

// GET /api/activity-log?page=1&limit=50&actionType=login&actorId=xxx
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50", 10)));
  const actionType = params.get("actionType");
  const actorId = params.get("actorId");

  const where: Record<string, unknown> = {};
  if (actionType) where.actionType = actionType;
  if (actorId) where.actorId = actorId;

  const [logs, total] = await Promise.all([
    prisma.systemActivityLog.findMany({
      where,
      include: {
        actor: { select: { id: true, username: true, displayName: true, role: true } },
        target: { select: { id: true, username: true, displayName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.systemActivityLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
