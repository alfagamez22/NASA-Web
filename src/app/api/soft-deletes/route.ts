import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/_helpers";

// GET /api/soft-deletes — list soft-deleted items (admin/super_admin)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const entityType = req.nextUrl.searchParams.get("entityType");

  const items = await prisma.softDelete.findMany({
    where: {
      restoredAt: null,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { deletedAt: "desc" },
    take: 200,
  });

  return NextResponse.json(items);
}

// PUT /api/soft-deletes — restore a soft-deleted item
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await prisma.softDelete.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.restoredAt) return NextResponse.json({ error: "Already restored" }, { status: 400 });

  const data = item.entityData as Record<string, unknown>;

  // Restore the entity based on its type
  try {
    await restoreEntity(item.entityType, data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to restore: " + (err instanceof Error ? err.message : "Unknown") }, { status: 500 });
  }

  // Mark as restored
  await prisma.softDelete.update({
    where: { id },
    data: { restoredAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/soft-deletes?id=xxx — permanently remove a soft-deleted record
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.softDelete.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

async function restoreEntity(entityType: string, data: Record<string, unknown>) {
  switch (entityType) {
    case "ContentSection": {
      const { media, links, slides, ...sectionData } = data as Record<string, unknown>;
      await prisma.contentSection.create({
        data: {
          id: sectionData.id as string,
          slug: sectionData.slug as string,
          title: sectionData.title as string,
          parentSlug: sectionData.parentSlug as string,
          description: (sectionData.description as string) ?? "",
          author: sectionData.author as string | null,
          authorUrl: sectionData.authorUrl as string | null,
          content: sectionData.content as string | null,
          colSpan: (sectionData.colSpan as number) ?? 1,
          order: (sectionData.order as number) ?? 0,
          buttonLabel: sectionData.buttonLabel as string | null,
          buttonUrl: sectionData.buttonUrl as string | null,
        },
      });
      break;
    }
    case "ToolCategory": {
      await prisma.toolCategory.create({ data: { id: data.id as string, slug: data.slug as string, title: data.title as string, parentSlug: data.parentSlug as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "Tool": {
      await prisma.tool.create({ data: { id: data.id as string, slug: data.slug as string, title: data.title as string, url: data.url as string, icon: (data.icon as string) ?? "Monitor", description: (data.description as string) ?? "", categorySlug: data.categorySlug as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "SpineMember": {
      await prisma.spineMember.create({ data: { id: data.id as string, name: data.name as string, role: data.role as string, img: (data.img as string) ?? "/placeholder.jpg", order: (data.order as number) ?? 0 } });
      break;
    }
    case "Team": {
      await prisma.team.create({ data: { id: data.id as string, seqId: data.seqId as number, label: data.label as string } });
      break;
    }
    case "TeamMember": {
      await prisma.teamMember.create({ data: { id: data.id as string, teamId: data.teamId as string, name: data.name as string, img: (data.img as string) ?? "/placeholder.jpg", role: data.role as "head" | "tl" | "atl" | "engineer", order: (data.order as number) ?? 0 } });
      break;
    }
    case "TeamDriveCategory": {
      await prisma.teamDriveCategory.create({ data: { id: data.id as string, title: data.title as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "TeamDriveItem": {
      await prisma.teamDriveItem.create({ data: { id: data.id as string, categoryId: data.categoryId as string, label: data.label as string, url: data.url as string, urlType: (data.urlType as string) ?? "url", order: (data.order as number) ?? 0 } });
      break;
    }
    case "VortexCategory": {
      await prisma.vortexCategory.create({ data: { id: data.id as string, title: data.title as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "VortexItem": {
      await prisma.vortexItem.create({ data: { id: data.id as string, categoryId: data.categoryId as string, content: data.content as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "VortexCredit": {
      await prisma.vortexCredit.create({ data: { id: data.id as string, name: data.name as string, role: data.role as string, order: (data.order as number) ?? 0 } });
      break;
    }
    case "ReportSlide": {
      await prisma.reportSlide.create({ data: { id: data.id as string, label: data.label as string, gurl: data.gurl as string, colSpan: (data.colSpan as number) ?? 1, order: (data.order as number) ?? 0 } });
      break;
    }
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
