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
  const { error } = await requireEditor();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (type === "category") {
    await prisma.teamDriveCategory.delete({ where: { id } });
  } else {
    await prisma.teamDriveItem.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
