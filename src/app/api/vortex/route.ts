import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth, requireEditor } from "@/shared/utils/api-helpers";

// GET /api/vortex
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const [config, categories, credits] = await Promise.all([
    prisma.vortexConfig.findUnique({ where: { id: "singleton" } }),
    prisma.vortexCategory.findMany({
      orderBy: { order: "asc" },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.vortexCredit.findMany({ orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({ config, categories, credits });
}

// PUT /api/vortex
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "config") {
    const config = await prisma.vortexConfig.upsert({
      where: { id: "singleton" },
      update: {
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        bgType: body.bgType,
        bgValue: body.bgValue,
      },
      create: {
        id: "singleton",
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        bgType: body.bgType,
        bgValue: body.bgValue,
      },
    });
    return NextResponse.json(config);
  }

  if (body.type === "category") {
    const cat = await prisma.vortexCategory.update({
      where: { id: body.id },
      data: { title: body.title, order: body.order },
    });
    return NextResponse.json(cat);
  }

  if (body.type === "item") {
    const item = await prisma.vortexItem.update({
      where: { id: body.id },
      data: { content: body.content, order: body.order },
    });
    return NextResponse.json(item);
  }

  if (body.type === "credit") {
    const credit = await prisma.vortexCredit.update({
      where: { id: body.id },
      data: { name: body.name, role: body.role, order: body.order },
    });
    return NextResponse.json(credit);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// POST /api/vortex
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();

  if (body.type === "category") {
    const cat = await prisma.vortexCategory.create({
      data: { title: body.title, order: body.order ?? 0 },
    });
    return NextResponse.json(cat, { status: 201 });
  }

  if (body.type === "item") {
    const item = await prisma.vortexItem.create({
      data: { categoryId: body.categoryId, content: body.content, order: body.order ?? 0 },
    });
    return NextResponse.json(item, { status: 201 });
  }

  if (body.type === "credit") {
    const credit = await prisma.vortexCredit.create({
      data: { name: body.name, role: body.role, order: body.order ?? 0 },
    });
    return NextResponse.json(credit, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// DELETE /api/vortex?id=xxx&type=category|item|credit
export async function DELETE(req: NextRequest) {
  const { error, session } = await requireEditor();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const username = (session!.user as { username?: string }).username || "unknown";

  if (type === "category") {
    const category = await prisma.vortexCategory.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    await prisma.softDelete.create({
      data: {
        entityType: "VortexCategory",
        entityId: id,
        entityData: category as any,
        deletedBy: username,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.vortexCategory.delete({ where: { id } });
  } else if (type === "item") {
    const item = await prisma.vortexItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.softDelete.create({
      data: {
        entityType: "VortexItem",
        entityId: id,
        entityData: item as any,
        deletedBy: username,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.vortexItem.delete({ where: { id } });
  } else if (type === "credit") {
    const credit = await prisma.vortexCredit.findUnique({ where: { id } });
    if (!credit) return NextResponse.json({ error: "Credit not found" }, { status: 404 });

    await prisma.softDelete.create({
      data: {
        entityType: "VortexCredit",
        entityId: id,
        entityData: credit as any,
        deletedBy: username,
        purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.vortexCredit.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
