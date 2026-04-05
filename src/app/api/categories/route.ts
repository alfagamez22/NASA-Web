import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/categories?parent=home
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const parent = req.nextUrl.searchParams.get("parent");
  const where = parent ? { parentSlug: parent } : {};

  const categories = await prisma.toolCategory.findMany({
    where,
    orderBy: { order: "asc" },
    include: { tools: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(categories);
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const category = await prisma.toolCategory.create({
    data: {
      slug: body.slug,
      title: body.title,
      parentSlug: body.parentSlug,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(category, { status: 201 });
}

// PUT /api/categories (update by slug in body)
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const { slug, ...data } = body;

  const category = await prisma.toolCategory.update({
    where: { slug },
    data,
  });

  return NextResponse.json(category);
}

// DELETE /api/categories?slug=xxx
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await prisma.toolCategory.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
