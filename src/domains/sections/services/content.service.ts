/**
 * Content Service — Typed data access layer
 *
 * All content is loaded from JSON data files and accessed via slug lookups.
 * This abstraction makes it trivial to swap to a real database later —
 * only the implementations here need to change, not any components.
 */

import type {
  Module,
  ToolCategory,
  ContentSection,
  SlideItem,
  NavItem,
  ToolItem,
} from "@/shared/types";

import modulesData from "@/data/modules.json";
import categoriesData from "@/data/categories.json";
import sectionsData from "@/data/sections.json";

/* ------------------------------------------------------------------ */
/*  Typed data (JSON imports are untyped, cast once here)              */
/* ------------------------------------------------------------------ */

const modules: Module[] = modulesData as Module[];
const categories: ToolCategory[] = categoriesData as ToolCategory[];
const sections: ContentSection[] = sectionsData as ContentSection[];

/* ------------------------------------------------------------------ */
/*  Module operations                                                  */
/* ------------------------------------------------------------------ */

/** Get all modules sorted by order */
export function getModules(): Module[] {
  return [...modules].sort((a, b) => a.order - b.order);
}

/** Get a single module by slug */
export function getModuleBySlug(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug);
}

/** Derive NavItem[] from modules (replaces old NAV_ITEMS constant) */
export function getNavItems(): NavItem[] {
  return getModules().map((m) => ({
    label: m.slug.toUpperCase().replace(/-/g, ""),
    href: m.href,
    display: m.display,
    subItems: m.subNav,
  }));
}

/* ------------------------------------------------------------------ */
/*  Category / Tool operations                                         */
/* ------------------------------------------------------------------ */

/** Get all categories under a given parent slug, sorted by order */
export function getCategoriesByParent(parentSlug: string): ToolCategory[] {
  return categories
    .filter((c) => c.parentSlug === parentSlug)
    .sort((a, b) => a.order - b.order);
}

/** Get a single category by slug */
export function getCategoryBySlug(slug: string): ToolCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Get all tools across all categories (for search) */
export function getAllTools(): ToolItem[] {
  return categories.flatMap((c) =>
    c.tools.sort((a, b) => a.order - b.order)
  );
}

/** Get tools belonging to a specific category slug */
export function getToolsByCategory(categorySlug: string): ToolItem[] {
  const cat = getCategoryBySlug(categorySlug);
  return cat ? [...cat.tools].sort((a, b) => a.order - b.order) : [];
}

/* ------------------------------------------------------------------ */
/*  Content Section operations                                         */
/* ------------------------------------------------------------------ */

/** Get all sections under a given parent slug, sorted by order */
export function getSectionsByParent(parentSlug: string): ContentSection[] {
  return sections
    .filter((s) => s.parentSlug === parentSlug)
    .sort((a, b) => a.order - b.order);
}

/** Get a single section by slug */
export function getSectionBySlug(slug: string): ContentSection | undefined {
  return sections.find((s) => s.slug === slug);
}

/** Get all sections (for search) */
export function getAllSections(): ContentSection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

/* ------------------------------------------------------------------ */
/*  Slide operations                                                   */
/* ------------------------------------------------------------------ */

/** Get slides belonging to a section, sorted by order */
export function getSlidesBySection(sectionSlug: string): SlideItem[] {
  const section = getSectionBySlug(sectionSlug);
  if (!section?.slides) return [];
  return [...section.slides].sort((a, b) => a.order - b.order);
}

/** Get a single slide by slug (searches across all sections) */
export function getSlideBySlug(slug: string): SlideItem | undefined {
  for (const section of sections) {
    const slide = section.slides?.find((s) => s.slug === slug);
    if (slide) return slide;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Slug resolution for dynamic routing                                */
/* ------------------------------------------------------------------ */

export type ResolvedRoute =
  | { type: "module"; module: Module }
  | { type: "section"; section: ContentSection; parentModule: Module }
  | { type: "category"; category: ToolCategory; parentModule: Module }
  | { type: "slide"; slide: SlideItem; parentSection: ContentSection; parentModule: Module }
  | { type: "not-found" };

/**
 * Resolve URL slug segments into a typed route.
 *
 * Examples:
 *   ["know-more"]                            → module
 *   ["know-more", "ran-functions-and-limitations"] → section
 *   ["know-more", "ran-functions-and-limitations", "ran-overview"] → slide
 *   ["home", "dashboards"]                   → category
 */
export function resolveSlugRoute(segments: string[]): ResolvedRoute {
  if (segments.length === 0) {
    const homeModule = getModuleBySlug("home");
    if (homeModule) return { type: "module", module: homeModule };
    return { type: "not-found" };
  }

  const [first, second, third] = segments;

  // 1. Try to match a module
  const mod = getModuleBySlug(first);
  if (!mod) return { type: "not-found" };

  // Only first segment — return the module itself
  if (!second) return { type: "module", module: mod };

  // 2. Two segments — try section, then category
  const section = getSectionBySlug(second);
  if (section && section.parentSlug === first) {
    if (!third) return { type: "section", section, parentModule: mod };

    // 3. Three segments — try slide within section
    const slide = section.slides?.find((s) => s.slug === third);
    if (slide) {
      return { type: "slide", slide, parentSection: section, parentModule: mod };
    }
    return { type: "not-found" };
  }

  const category = getCategoryBySlug(second);
  if (category && category.parentSlug === first) {
    return { type: "category", category, parentModule: mod };
  }

  return { type: "not-found" };
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

/** Collect all slugs across all entity types and check for duplicates */
export function validateSlugUniqueness(): { valid: boolean; duplicates: string[] } {
  const allSlugs: string[] = [];

  modules.forEach((m) => allSlugs.push(m.slug));
  categories.forEach((c) => {
    allSlugs.push(c.slug);
    c.tools.forEach((t) => allSlugs.push(t.slug));
  });
  sections.forEach((s) => {
    allSlugs.push(s.slug);
    s.slides?.forEach((slide) => allSlugs.push(slide.slug));
  });

  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const slug of allSlugs) {
    if (seen.has(slug)) duplicates.push(slug);
    seen.add(slug);
  }

  return { valid: duplicates.length === 0, duplicates };
}
