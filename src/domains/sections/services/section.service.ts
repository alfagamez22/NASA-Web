import { prisma } from "@/infrastructure/prisma/client";
import { notFound, badRequest } from "@/shared/utils/error-handler";

const sectionIncludes = {
  media: { orderBy: { order: "asc" as const } },
  links: { orderBy: { order: "asc" as const } },
  slides: {
    orderBy: { order: "asc" as const },
    include: { columns: { orderBy: { order: "asc" as const } } },
  },
};

export async function getSection(slug: string) {
  return prisma.contentSection.findUnique({
    where: { slug },
    include: sectionIncludes,
  });
}

export async function listSections(parentSlug?: string | null) {
  const where = parentSlug ? { parentSlug } : {};
  return prisma.contentSection.findMany({
    where,
    orderBy: { order: "asc" },
    include: sectionIncludes,
  });
}

export async function deleteSection(slug: string, deletedBy: string) {
  if (!slug) throw badRequest("slug required");

  const section = await prisma.contentSection.findUnique({
    where: { slug },
    include: sectionIncludes,
  });

  if (!section) throw notFound("Section not found");

  await prisma.softDelete.create({
    data: {
      entityType: "ContentSection",
      entityId: section.id,
      entityData: section as any,
      deletedBy,
      purgeAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.contentSection.delete({ where: { slug } });
  return { success: true };
}
