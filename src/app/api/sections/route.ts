import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireEditor } from "@/app/api/_helpers";

// GET /api/sections?parent=know-more
export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const parent = req.nextUrl.searchParams.get("parent");
  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const section = await prisma.contentSection.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { order: "asc" } },
        links: { orderBy: { order: "asc" } },
        slides: {
          orderBy: { order: "asc" },
          include: { columns: { orderBy: { order: "asc" } } },
        },
      },
    });
    return NextResponse.json(section);
  }

  const where = parent ? { parentSlug: parent } : {};
  const sections = await prisma.contentSection.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      media: { orderBy: { order: "asc" } },
      links: { orderBy: { order: "asc" } },
      slides: {
        orderBy: { order: "asc" },
        include: { columns: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json(sections);
}

// POST /api/sections
export async function POST(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const section = await prisma.contentSection.create({
    data: {
      slug: body.slug,
      title: body.title,
      parentSlug: body.parentSlug,
      description: body.description ?? "",
      author: body.author ?? null,
      authorUrl: body.authorUrl ?? null,
      colSpan: body.colSpan ?? 1,
      order: body.order ?? 0,
      buttonLabel: body.buttonLabel ?? null,
      buttonUrl: body.buttonUrl ?? null,
    },
  });

  return NextResponse.json(section, { status: 201 });
}

// PUT /api/sections
export async function PUT(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const body = await req.json();
  const { slug, media, links, slides, ...data } = body;

  const section = await prisma.contentSection.update({
    where: { slug },
    data,
  });

  return NextResponse.json(section);
}

// DELETE /api/sections?slug=xxx
export async function DELETE(req: NextRequest) {
  const { error } = await requireEditor();
  if (error) return error;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  await prisma.contentSection.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
