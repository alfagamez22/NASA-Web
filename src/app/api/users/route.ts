import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth, requireAdmin, requireOutranks } from "@/shared/utils/api-helpers";
import { outranks, getRank, manageableRoles } from "@/domains/auth/services/role-hierarchy";
import { logActivity } from "@/infrastructure/logging/activity-logger";
import { sendWelcomeEmail } from "@/infrastructure/email/email.service";
import bcrypt from "bcryptjs";

// GET /api/users
export async function GET(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const callerRole = (session!.user as { role: string }).role;
  const callerRank = getRank(callerRole);

  // Only show users of lower rank (super_admin sees admin+editor+viewer, admin sees editor+viewer)
  const users = await prisma.user.findMany({
    select: {
      id: true, username: true, displayName: true, role: true, createdAt: true,
      email: true, emailVerified: true, suspended: true, lastLoginAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Filter: only show users with strictly lower rank
  const filtered = users.filter(u => getRank(u.role) < callerRank);
  return NextResponse.json(filtered);
}

// POST /api/users (create user)
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const callerRole = (session!.user as { role: string }).role;
  const targetRole = body.role ?? "viewer";

  // F11: Cannot create accounts of equal or higher rank
  if (!outranks(callerRole, targetRole)) {
    return NextResponse.json({ error: "Cannot create accounts of equal or higher rank" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { username: body.username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  // Check email uniqueness if provided
  if (body.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
    if (emailExists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      username: body.username,
      passwordHash,
      displayName: body.displayName,
      role: targetRole,
      email: body.email || null,
      createdBy: session!.user.id,
    },
    select: { id: true, username: true, displayName: true, role: true, email: true },
  });

  // F12: Log account creation
  await logActivity({
    actorId: session!.user.id,
    actionType: "account_created",
    targetId: user.id,
    metadata: { username: user.username, role: targetRole },
  });

  // F14: Send welcome email if email was provided
  if (body.email) {
    sendWelcomeEmail(body.email, body.displayName, body.username).catch(() => {});
  }

  return NextResponse.json(user, { status: 201 });
}

// PUT /api/users
export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const callerRole = (session!.user as { role: string }).role;

  // Fetch target user to check rank
  const target = await prisma.user.findUnique({ where: { id: body.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // F11: Cannot edit users of equal or higher rank
  if (!outranks(callerRole, target.role)) {
    return NextResponse.json({ error: "Cannot modify accounts of equal or higher rank" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};

  if (body.displayName) data.displayName = body.displayName;

  if (body.role) {
    // F11: Cannot promote to equal or higher rank
    if (!outranks(callerRole, body.role)) {
      return NextResponse.json({ error: "Cannot assign a role equal to or above your own" }, { status: 403 });
    }
    data.role = body.role;

    // F12: Log permission change
    if (body.role !== target.role) {
      await prisma.permissionAuditLog.create({
        data: {
          whoChangedId: session!.user.id,
          accountAffectedId: body.id,
          permissionChanged: "role",
          oldValue: target.role,
          newValue: body.role,
        },
      });
      await logActivity({
        actorId: session!.user.id,
        actionType: "permission_changed",
        targetId: body.id,
        metadata: { field: "role", oldValue: target.role, newValue: body.role },
      });
    }
  }

  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
  if (body.username) {
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing && existing.id !== body.id) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    data.username = body.username;
  }
  if (body.email !== undefined) {
    if (body.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailExists && emailExists.id !== body.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }
    data.email = body.email || null;
  }

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    select: { id: true, username: true, displayName: true, role: true, email: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/users?id=xxx
export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Prevent self-deletion
  if (id === session!.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // F11: Cannot delete users of equal or higher rank
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const callerRole = (session!.user as { role: string }).role;
  if (!outranks(callerRole, target.role)) {
    return NextResponse.json({ error: "Cannot delete accounts of equal or higher rank" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
