import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/drive
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const categories = await prisma.teamDriveCategory.findMany({
    orderBy: { order: "asc" },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(categories);
}

// POST /api/drive
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "category") {
    const cat = await prisma.teamDriveCategory.create({
      data: { title: body.title, order: body.order ?? 0 },
    });
    return NextResponse.json(cat, { status: 201 });
  }

  const item = await prisma.teamDriveItem.create({
    data: {
      categoryId: body.categoryId,
      label: body.label,
      url: body.url,
      urlType: body.urlType ?? "url",
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

// PUT /api/drive
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "category") {
    const cat = await prisma.teamDriveCategory.update({
      where: { id: body.id },
      data: { title: body.title, order: body.order },
    });
    return NextResponse.json(cat);
  }

  const item = await prisma.teamDriveItem.update({
    where: { id: body.id },
    data: { label: body.label, url: body.url, urlType: body.urlType, order: body.order },
  });
  return NextResponse.json(item);
}

// DELETE /api/drive?id=xxx&type=category|item
export async function DELETE(req: NextRequest) {
  const { error, session } = await requireEditor();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const username = (session!.user as { username?: string }).username || "unknown";

  if (type === "category") {
    const category = await prisma.teamDriveCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    await prisma.softDelete.create({
      data: {
        entityType: "TeamDriveCategory",
        entityId: id,
        entityData: category as any,
        deletedBy: username,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.teamDriveCategory.delete({ where: { id } });
  } else {
    const item = await prisma.teamDriveItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.softDelete.create({
      data: {
        entityType: "TeamDriveItem",
        entityId: id,
        entityData: item as any,
        deletedBy: username,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.teamDriveItem.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
