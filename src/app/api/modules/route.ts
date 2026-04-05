import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/modules
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(modules);
}

// PUT /api/modules — update a module's display name or subNav
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const { id, display, subNav } = body as { id: string; display?: string; subNav?: { display: string; href: string; format?: string }[] };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (display !== undefined) data.display = display;
  if (subNav !== undefined) data.subNav = subNav;

  const updated = await prisma.module.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
