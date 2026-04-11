import { prisma } from "@/infrastructure/prisma/client";
import { notFound, badRequest } from "@/shared/utils/error-handler";

export async function listTools(categorySlug?: string | null) {
  const where = categorySlug ? { categorySlug } : {};
  return prisma.tool.findMany({ where, orderBy: { order: "asc" } });
}

export async function createTool(data: {
  slug: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  categorySlug: string;
  order?: number;
}) {
  return prisma.tool.create({
    data: {
      slug: data.slug,
      title: data.title,
      url: data.url,
      icon: data.icon ?? "Monitor",
      description: data.description ?? "",
      categorySlug: data.categorySlug,
      order: data.order ?? 0,
    },
  });
}

export async function updateTool(slug: string, data: Record<string, unknown>) {
  return prisma.tool.update({ where: { slug }, data });
}

export async function deleteTool(slug: string, deletedBy: string) {
  if (!slug) throw badRequest("slug required");

  const tool = await prisma.tool.findUnique({ where: { slug } });
  if (!tool) throw notFound("Tool not found");

  await prisma.softDelete.create({
    data: {
      entityType: "Tool",
      entityId: tool.id,
      entityData: tool as any,
      deletedBy,
      purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.tool.delete({ where: { slug } });
  return { success: true };
}
