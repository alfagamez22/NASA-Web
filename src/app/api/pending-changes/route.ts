import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor, requireAdmin } from "@/app/api/_helpers";

// GET /api/pending-changes — list pending changes (optionally filter by status)
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";

  const changes = await prisma.pendingChange.findMany({
    where: status === "all" ? {} : { status: status as "pending" | "approved" | "declined" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(changes);
}

// POST /api/pending-changes — editor creates a pending change
export async function POST(req: NextRequest) {
  const { error, session } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const user = session!.user as { id: string; name?: string; role?: string };

  const change = await prisma.pendingChange.create({
    data: {
      page: body.page,
      changeType: body.changeType,
      itemName: body.itemName,
      snapshot: body.snapshot ?? null,
      entityRef: body.entityRef ?? null,
      userId: user.id,
      username: user.name || "Unknown",
    },
  });

  // Also create an activity log entry
  await prisma.activityLog.create({
    data: {
      page: body.page,
      changeType: body.changeType,
      itemName: body.itemName,
      username: user.name || "Unknown",
      userId: user.id,
      status: "pending",
    },
  });

  // Create a notification for admin
  await prisma.notification.create({
    data: {
      page: body.page,
      changeType: body.changeType,
      itemName: body.itemName,
      username: user.name || "Unknown",
      userId: user.id,
    },
  });

  return NextResponse.json(change, { status: 201 });
}

// PUT /api/pending-changes — admin approves or declines
export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, action, reason } = body; // action: "approve" | "decline"
  const adminUser = session!.user as { id: string; name?: string };

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const change = await prisma.pendingChange.findUnique({ where: { id } });
  if (!change) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (change.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "declined";

  // If approving, replay the stored API call to apply the change
  if (action === "approve" && change.snapshot) {
    const snap = change.snapshot as { apiUrl?: string; apiMethod?: string; apiBody?: unknown };
    if (snap.apiUrl && snap.apiMethod) {
      const origin = req.nextUrl.origin;
      const cookie = req.headers.get("cookie") || "";
      const apiRes = await fetch(`${origin}${snap.apiUrl}`, {
        method: snap.apiMethod,
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: snap.apiBody ? JSON.stringify(snap.apiBody) : undefined,
      });
      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => "Unknown error");
        return NextResponse.json({ error: "Failed to apply change", detail: errText }, { status: 500 });
      }
    }
  }

  // Update the pending change
  const updated = await prisma.pendingChange.update({
    where: { id },
    data: {
      status: newStatus as "approved" | "declined",
      reviewedBy: adminUser.name || "Admin",
      reviewedAt: new Date(),
      reason: reason || null,
    },
  });

  // Update the activity log
  await prisma.activityLog.updateMany({
    where: {
      page: change.page,
      changeType: change.changeType,
      itemName: change.itemName,
      userId: change.userId,
      status: "pending",
    },
    data: { status: newStatus },
  });

  // Mark any existing notifications for this change as read (to prevent duplicates)
  await prisma.notification.updateMany({
    where: {
      page: change.page,
      changeType: change.changeType,
      itemName: change.itemName,
      userId: change.userId,
    },
    data: { read: true },
  });

  return NextResponse.json(updated);
}
