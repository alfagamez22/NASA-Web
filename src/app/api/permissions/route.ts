import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/_helpers";

// GET /api/permissions?userId=xxx
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const userId = req.nextUrl.searchParams.get("userId");

  if (userId) {
    const perm = await prisma.viewerPermission.findUnique({ where: { userId } });
    return NextResponse.json(perm ?? { userId, allowedPages: [] });
  }

  const all = await prisma.viewerPermission.findMany();
  return NextResponse.json(all);
}

// PUT /api/permissions
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, allowedPages } = body;

  if (!userId || !Array.isArray(allowedPages)) {
    return NextResponse.json({ error: "userId and allowedPages required" }, { status: 400 });
  }

  const perm = await prisma.viewerPermission.upsert({
    where: { userId },
    update: { allowedPages },
    create: { userId, allowedPages },
  });

  return NextResponse.json(perm);
}
