import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth, requireEditor } from "@/shared/utils/api-helpers";

// GET /api/modules
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(modules);
}

// POST /api/modules — create a new top-level nav module
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const { display, format } = body as { display: string; format?: string };

  if (!display?.trim()) return NextResponse.json({ error: "display name required" }, { status: 400 });

  const slug = display.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const href = `/${slug}`;

  // Get highest order
  const last = await prisma.module.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? 0) + 1;

  const mod = await prisma.module.create({
    data: {
      slug,
      title: display.trim().toUpperCase(),
      href,
      display: display.trim().toUpperCase(),
      order: nextOrder,
      format: format || "A",
      children: [],
      subNav: [],
    },
  });

  return NextResponse.json(mod, { status: 201 });
}

// DELETE /api/modules — delete a top-level module
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PUT /api/modules — update a module's display name, subNav, or reorder
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  // Bulk reorder: { reorder: [{ id, order }] }
  if (body.reorder && Array.isArray(body.reorder)) {
    const ops = (body.reorder as { id: string; order: number }[]).map((item) =>
      prisma.module.update({ where: { id: item.id }, data: { order: item.order } })
    );
    await prisma.$transaction(ops);
    return NextResponse.json({ success: true });
  }

  const { id, display, subNav, format } = body as { id: string; display?: string; subNav?: { display: string; href: string; format?: string }[]; format?: string };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (display !== undefined) data.display = display;
  if (subNav !== undefined) data.subNav = subNav;
  if (format !== undefined) data.format = format;

  const updated = await prisma.module.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
