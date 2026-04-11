/**
 * Slug utilities — generation, validation, and breadcrumb building
 */

/** Generate a URL-safe slug from any string */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove non-alphanumeric except spaces/hyphens
    .replace(/[\s_]+/g, "-")     // replace spaces and underscores with hyphens
    .replace(/-+/g, "-")         // collapse consecutive hyphens
    .replace(/^-|-$/g, "");      // trim leading/trailing hyphens
}

/** Validate that a slug matches the expected format */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/** Assert a slug is unique within a set; throws if duplicate */
export function assertUniqueSlug(slug: string, existingSlugs: string[]): void {
  if (existingSlugs.includes(slug)) {
    throw new Error(`Duplicate slug detected: "${slug}"`);
  }
}

/** Build a breadcrumb trail from an array of slug segments */
export function buildBreadcrumb(
  segments: string[],
  labels?: Record<string, string>
): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: "HOME", href: "/" },
  ];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = labels?.[seg] ?? seg.replace(/-/g, " ").toUpperCase();
    crumbs.push({ label, href: path });
  }

  return crumbs;
}
