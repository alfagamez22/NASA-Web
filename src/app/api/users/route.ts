import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/app/api/_helpers";
import bcrypt from "bcryptjs";

// GET /api/users
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, displayName: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

// POST /api/users (create user)
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();

  const existing = await prisma.user.findUnique({ where: { username: body.username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      username: body.username,
      passwordHash,
      displayName: body.displayName,
      role: body.role ?? "viewer",
    },
    select: { id: true, username: true, displayName: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}

// PUT /api/users
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.displayName) data.displayName = body.displayName;
  if (body.role) data.role = body.role;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
  if (body.username) {
    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing && existing.id !== body.id) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    data.username = body.username;
  }

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    select: { id: true, username: true, displayName: true, role: true },
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

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
