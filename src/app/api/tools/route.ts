import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/tools?category=dashboards
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const category = req.nextUrl.searchParams.get("category");
  const where = category ? { categorySlug: category } : {};

  const tools = await prisma.tool.findMany({
    where,
    orderBy: { order: "asc" },
  });

  return NextResponse.json(tools);
}

// POST /api/tools
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const tool = await prisma.tool.create({
    data: {
      slug: body.slug,
      title: body.title,
      url: body.url,
      icon: body.icon ?? "Monitor",
      description: body.description ?? "",
      categorySlug: body.categorySlug,
      order: body.order ?? 0,
    },
  });

  return NextResponse.json(tool, { status: 201 });
}

// PUT /api/tools
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const { slug, ...data } = body;

  const tool = await prisma.tool.update({
    where: { slug },
    data,
  });

  return NextResponse.json(tool);
}

// DELETE /api/tools?slug=xxx
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await prisma.tool.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
