import { notFound } from "next/navigation";
import { resolveSlugRoute, getModules } from "@/lib/content-service";

import HomeSection from "@/components/sections/HomeSection";
import KnowMoreSection from "@/components/sections/KnowMoreSection";
// import TrackerSection from "@/components/sections/TrackerSection";
import ReportSection from "@/components/sections/ReportSection";
import TeamSection from "@/components/sections/TeamSection";
import SectionDetailPage from "@/components/content/SectionDetailPage";

/**
 * Catch-all dynamic route — resolves any slug path to the appropriate view.
 *
 * Examples:
 *   /home              → Home module
 *   /know-more         → Know More listing
 *   /know-more/ran-functions-and-limitations → Section detail
 *   /tracker           → Tracker module
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
      return notFound();
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
      const HomeComponent = MODULE_COMPONENTS.home;
      return <HomeComponent />;

    case "slide":
      return (
        <SectionDetailPage
          section={resolved.parentSection}
          parentModule={resolved.parentModule}
        />
      );

    case "not-found":
    default:
      return notFound();
  }
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
    default:
      return { title: "Not Found — SCC RAN Portal" };
  }
}
