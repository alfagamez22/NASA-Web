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

  // If declined and it was an "add" or "edit", we need to revert using the snapshot
  if (action === "decline" && change.entityRef && change.snapshot) {
    try {
      await revertChange(change);
    } catch (e) {
      console.error("Failed to revert change:", e);
    }
  }

  return NextResponse.json(updated);
}

/**
 * Revert a declined change using the entityRef.
 * entityRef format: "ModelName:fieldName:value"
 * e.g. "ContentSection:slug:abc123" or "Tool:id:xyz"
 */
async function revertChange(change: {
  changeType: string;
  entityRef: string | null;
  snapshot: unknown;
}) {
  if (!change.entityRef) return;

  const [model, field, ...valueParts] = change.entityRef.split(":");
  const value = valueParts.join(":");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where = { [field]: value } as any;

  if (change.changeType === "add") {
    switch (model) {
      case "ContentSection": await prisma.contentSection.delete({ where }).catch(() => {}); break;
      case "ToolCategory": await prisma.toolCategory.delete({ where }).catch(() => {}); break;
      case "Tool": await prisma.tool.delete({ where }).catch(() => {}); break;
      case "SpineMember": await prisma.spineMember.delete({ where }).catch(() => {}); break;
      case "Team": await prisma.team.delete({ where }).catch(() => {}); break;
      case "TeamMember": await prisma.teamMember.delete({ where }).catch(() => {}); break;
      case "TeamDriveCategory": await prisma.teamDriveCategory.delete({ where }).catch(() => {}); break;
      case "TeamDriveItem": await prisma.teamDriveItem.delete({ where }).catch(() => {}); break;
      case "VortexCategory": await prisma.vortexCategory.delete({ where }).catch(() => {}); break;
      case "VortexItem": await prisma.vortexItem.delete({ where }).catch(() => {}); break;
      case "VortexCredit": await prisma.vortexCredit.delete({ where }).catch(() => {}); break;
      case "ReportSlide": await prisma.reportSlide.delete({ where }).catch(() => {}); break;
    }
  } else if (change.changeType === "edit" && change.snapshot) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = change.snapshot as any;
    switch (model) {
      case "ContentSection": await prisma.contentSection.update({ where, data: snap }).catch(() => {}); break;
      case "ToolCategory": await prisma.toolCategory.update({ where, data: snap }).catch(() => {}); break;
      case "Tool": await prisma.tool.update({ where, data: snap }).catch(() => {}); break;
      case "SpineMember": await prisma.spineMember.update({ where, data: snap }).catch(() => {}); break;
      case "Team": await prisma.team.update({ where, data: snap }).catch(() => {}); break;
      case "TeamMember": await prisma.teamMember.update({ where, data: snap }).catch(() => {}); break;
      case "TeamDriveCategory": await prisma.teamDriveCategory.update({ where, data: snap }).catch(() => {}); break;
      case "TeamDriveItem": await prisma.teamDriveItem.update({ where, data: snap }).catch(() => {}); break;
      case "VortexCategory": await prisma.vortexCategory.update({ where, data: snap }).catch(() => {}); break;
      case "VortexItem": await prisma.vortexItem.update({ where, data: snap }).catch(() => {}); break;
      case "VortexCredit": await prisma.vortexCredit.update({ where, data: snap }).catch(() => {}); break;
    }
  } else if (change.changeType === "delete" && change.snapshot) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = change.snapshot as any;
    switch (model) {
      case "ContentSection": await prisma.contentSection.create({ data: snap }).catch(() => {}); break;
      case "ToolCategory": await prisma.toolCategory.create({ data: snap }).catch(() => {}); break;
      case "Tool": await prisma.tool.create({ data: snap }).catch(() => {}); break;
      case "SpineMember": await prisma.spineMember.create({ data: snap }).catch(() => {}); break;
      case "Team": await prisma.team.create({ data: snap }).catch(() => {}); break;
      case "TeamMember": await prisma.teamMember.create({ data: snap }).catch(() => {}); break;
      case "TeamDriveCategory": await prisma.teamDriveCategory.create({ data: snap }).catch(() => {}); break;
      case "TeamDriveItem": await prisma.teamDriveItem.create({ data: snap }).catch(() => {}); break;
      case "VortexCategory": await prisma.vortexCategory.create({ data: snap }).catch(() => {}); break;
      case "VortexItem": await prisma.vortexItem.create({ data: snap }).catch(() => {}); break;
      case "VortexCredit": await prisma.vortexCredit.create({ data: snap }).catch(() => {}); break;
    }
  }
}
