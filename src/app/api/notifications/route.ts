import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth, requireAdmin } from "@/shared/utils/api-helpers";

// GET /api/notifications
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// POST /api/notifications
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const notification = await prisma.notification.create({
    data: {
      page: body.page,
      changeType: body.changeType,
      itemName: body.itemName,
      username: session!.user.name || "Unknown",
      userId: session!.user.id,
    },
  });

  return NextResponse.json(notification, { status: 201 });
}

// PUT /api/notifications (mark read)
export async function PUT(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (body.id) {
    await prisma.notification.update({
      where: { id: body.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications (clear all — admin only)
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.notification.deleteMany();
  return NextResponse.json({ success: true });
}
