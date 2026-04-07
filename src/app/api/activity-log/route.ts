import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/app/api/_helpers";

// GET /api/activity-log — returns recent activity logs
// Query params:
//   ?recent=true&hours=24 — get recently applied/approved changes with entityRef (for highlighting)
//   ?userId=xxx — filter by user
//   ?limit=N — max results
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const recent = req.nextUrl.searchParams.get("recent");
  const hours = parseInt(req.nextUrl.searchParams.get("hours") ?? "24", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);
  const userId = req.nextUrl.searchParams.get("userId");

  // Recent changes mode — for highlight system
  if (recent === "true") {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await prisma.activityLog.findMany({
      where: {
        entityRef: { not: null },
        status: { in: ["applied", "approved"] },
        changeType: { in: ["add", "edit"] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
      select: {
        id: true,
        entityRef: true,
        changeType: true,
        itemName: true,
        username: true,
        createdAt: true,
      },
    });
    return NextResponse.json(logs);
  }

  const where = userId ? { userId } : {};

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
  });

  return NextResponse.json(logs);
}

// POST /api/activity-log — create a log entry (admin direct logging)
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const user = session!.user as { id: string; name?: string };

  const log = await prisma.activityLog.create({
    data: {
      page: body.page,
      changeType: body.changeType,
      itemName: body.itemName,
      username: user.name || "Unknown",
      userId: user.id,
      status: body.status || "applied",
      entityRef: body.entityRef || null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
