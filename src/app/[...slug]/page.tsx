import { notFound } from "next/navigation";
import { resolveSlugRoute, getModules } from "@/lib/content-service";
import { prisma } from "@/lib/prisma";

import HomeSection from "@/components/sections/HomeSection";
import KnowMoreSection from "@/components/sections/KnowMoreSection";
// import TrackerSection from "@/components/sections/TrackerSection";
import ReportSection from "@/components/sections/ReportSection";
import TeamSection from "@/components/sections/TeamSection";
import SectionDetailPage from "@/components/content/SectionDetailPage";
import DynamicPage from "@/components/sections/DynamicPage";

/**
 * Catch-all dynamic route — resolves any slug path to the appropriate view.
 *
 * 1. First tries static resolution (known modules from JSON data).
 * 2. Falls back to database resolution for dynamically created modules/sub-items.
 */

interface SlugPageProps {
  params: Promise<{ slug: string[] }>;
}

/** Map module slugs to their section-level components */
const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  home: HomeSection,
  "know-more": KnowMoreSection,
  // tracker: TrackerSection,
  report: ReportSection,
  team: TeamSection,
};

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug: segments } = await params;

  const resolved = resolveSlugRoute(segments);

  switch (resolved.type) {
    case "module": {
      const Component = MODULE_COMPONENTS[resolved.module.slug];
      if (Component) return <Component />;
      break; // Fall through to DB resolution
    }

    case "section":
      return (
        <SectionDetailPage
          section={resolved.section}
          parentModule={resolved.parentModule}
        />
      );

    case "category":
      // Category detail view — for now redirect to home
      return <HomeSection />;

    case "slide":
      return (
        <SectionDetailPage
          section={resolved.parentSection}
          parentModule={resolved.parentModule}
        />
      );

    // "not-found" falls through to DB resolution below
  }

  /* ── DB resolution for dynamically created modules / sub-items ── */
  const [first, ...rest] = segments;

  const dbModule = await prisma.module.findFirst({ where: { slug: first } });
  if (!dbModule) return notFound();

  // Top-level module page
  if (rest.length === 0) {
    const format = dbModule.format || "A";
    return <DynamicPage format={format} slug={first} title={dbModule.display} />;
  }

  // Sub-item resolution — match by href in the module's subNav JSON
  const subNav = (dbModule.subNav as { display: string; href: string; format?: string }[] | null) ?? [];
  const targetHref = `/${segments.join("/")}`;
  const subItem = subNav.find((s) => s.href === targetHref);
  if (!subItem) return notFound();

  const format = subItem.format || "A";
  const derivedSlug = segments.join("-"); // unique parentSlug for content
  return <DynamicPage format={format} slug={derivedSlug} title={subItem.display} />;
}

/** Generate static params for all known slugs */
export async function generateStaticParams() {
  const modules = getModules();
  const params: { slug: string[] }[] = [];

  for (const mod of modules) {
    // Skip "home" — it's served by the root route
    if (mod.slug === "home") continue;
    params.push({ slug: [mod.slug] });
  }

  return params;
}

/** Dynamic metadata based on resolved route */
export async function generateMetadata({ params }: SlugPageProps) {
  const { slug: segments } = await params;
  const resolved = resolveSlugRoute(segments);

  switch (resolved.type) {
    case "module":
      return { title: `${resolved.module.display} — SCC RAN Portal` };
    case "section":
      return { title: `${resolved.section.title} — SCC RAN Portal` };
    case "category":
      return { title: `${resolved.category.title} — SCC RAN Portal` };
    case "slide":
      return { title: `${resolved.slide.title} — SCC RAN Portal` };
  }

  // DB resolution for metadata
  const [first, ...rest] = segments;
  const dbModule = await prisma.module.findFirst({ where: { slug: first } });
  if (!dbModule) return { title: "Not Found — SCC RAN Portal" };

  if (rest.length === 0) return { title: `${dbModule.display} — SCC RAN Portal` };

  const subNav = (dbModule.subNav as { display: string; href: string }[] | null) ?? [];
  const targetHref = `/${segments.join("/")}`;
  const subItem = subNav.find((s) => s.href === targetHref);
  if (subItem) return { title: `${subItem.display} — SCC RAN Portal` };

  return { title: "Not Found — SCC RAN Portal" };
}
