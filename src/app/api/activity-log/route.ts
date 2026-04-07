import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/app/api/_helpers";

// GET /api/activity-log — returns recent activity logs
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);
  const userId = req.nextUrl.searchParams.get("userId");

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
    },
  });

  return NextResponse.json(log, { status: 201 });
}
