import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/prisma/client";
import { requireAuth, requireEditor } from "@/shared/utils/api-helpers";

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
      content: body.content ?? null,
      author: body.author ?? null,
      authorUrl: body.authorUrl ?? null,
      colSpan: body.colSpan ?? 1,
      order: body.order ?? 0,
      buttonLabel: body.buttonLabel ?? null,
      buttonUrl: body.buttonUrl ?? null,
      media: body.media?.length ? {
        create: body.media.map((m: Record<string, string>, i: number) => ({
          type: m.type?.replace("-", "_") ?? "image",
          url: m.url ?? null,
          gurl: m.gurl ?? null,
          yurl: m.yurl ?? null,
          alt: m.alt ?? null,
          caption: m.caption ?? null,
          order: i,
        })),
      } : undefined,
      links: body.links?.length ? {
        create: body.links.map((l: Record<string, string>, i: number) => ({
          label: l.label ?? "",
          url: l.url ?? "",
          order: i,
        })),
      } : undefined,
      slides: body.slides?.length ? {
        create: body.slides.map((s: Record<string, unknown>, si: number) => ({
          slug: (s.slug as string) || `slide-${Date.now()}-${si}`,
          title: (s.title as string) || "",
          layout: (s.layout as string) || "single",
          order: si,
          columns: (s.columns as Record<string, unknown>[])?.length ? {
            create: (s.columns as Record<string, unknown>[]).map((c: Record<string, unknown>, ci: number) => ({
              type: (c.type as string) || "text",
              content: (c.content as string) ?? null,
              mediaType: ((c.media as Record<string, string>)?.type as string) ?? null,
              mediaUrl: ((c.media as Record<string, string>)?.url as string) ?? null,
              mediaGurl: ((c.media as Record<string, string>)?.gurl as string) ?? null,
              mediaYurl: ((c.media as Record<string, string>)?.yurl as string) ?? null,
              order: ci,
            })),
          } : undefined,
        })),
      } : undefined,
    },
    include: {
      media: { orderBy: { order: "asc" } },
      links: { orderBy: { order: "asc" } },
      slides: { orderBy: { order: "asc" }, include: { columns: { orderBy: { order: "asc" } } } },
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

  // Update base section fields
  const section = await prisma.contentSection.update({
    where: { slug },
    data,
  });

  // Replace media if provided
  if (media !== undefined) {
    await prisma.sectionMedia.deleteMany({ where: { sectionId: section.id } });
    if (media?.length) {
      await prisma.sectionMedia.createMany({
        data: media.map((m: Record<string, string>, i: number) => ({
          sectionId: section.id,
          type: m.type?.replace("-", "_") ?? "image",
          url: m.url ?? null,
          gurl: m.gurl ?? null,
          yurl: m.yurl ?? null,
          alt: m.alt ?? null,
          caption: m.caption ?? null,
          order: i,
        })),
      });
    }
  }

  // Replace links if provided
  if (links !== undefined) {
    await prisma.sectionLink.deleteMany({ where: { sectionId: section.id } });
    if (links?.length) {
      await prisma.sectionLink.createMany({
        data: links.map((l: Record<string, string>, i: number) => ({
          sectionId: section.id,
          label: l.label ?? "",
          url: l.url ?? "",
          order: i,
        })),
      });
    }
  }

  // Replace slides if provided
  if (slides !== undefined) {
    // Delete old slides (columns cascade)
    await prisma.slideItem.deleteMany({ where: { sectionId: section.id } });
    if (slides?.length) {
      for (let si = 0; si < slides.length; si++) {
        const s = slides[si];
        await prisma.slideItem.create({
          data: {
            slug: s.slug || `slide-${Date.now()}-${si}`,
            title: s.title || "",
            sectionId: section.id,
            layout: s.layout || "single",
            order: si,
            columns: s.columns?.length ? {
              create: s.columns.map((c: Record<string, unknown>, ci: number) => ({
                type: (c.type as string) || "text",
                content: (c.content as string) ?? null,
                mediaType: ((c.media as Record<string, string>)?.type as string) ?? null,
                mediaUrl: ((c.media as Record<string, string>)?.url as string) ?? null,
                mediaGurl: ((c.media as Record<string, string>)?.gurl as string) ?? null,
                mediaYurl: ((c.media as Record<string, string>)?.yurl as string) ?? null,
                order: ci,
              })),
            } : undefined,
          },
        });
      }
    }
  }

  // Return full section with relations
  const full = await prisma.contentSection.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { order: "asc" } },
      links: { orderBy: { order: "asc" } },
      slides: { orderBy: { order: "asc" }, include: { columns: { orderBy: { order: "asc" } } } },
    },
  });

  return NextResponse.json(full);
}

// DELETE /api/sections?slug=xxx
export async function DELETE(req: NextRequest) {
  const { error, session } = await requireEditor();
  if (error) return error;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  // Get full section data before deletion
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

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  // Create soft-delete record
  const username = (session!.user as { username?: string }).username || "unknown";
  await prisma.softDelete.create({
    data: {
      entityType: "ContentSection",
      entityId: section.id,
      entityData: section as any,
      deletedBy: username,
      purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Now delete the section
  await prisma.contentSection.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
