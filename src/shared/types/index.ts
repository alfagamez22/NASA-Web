/**
 * Slug-Based Content & Routing System — Type Definitions
 *
 * Every content entity in the portal is identified by a unique slug.
 * Slugs are used for routing, retrieval, and dynamic rendering.
 *
 * Hierarchy:
 *   Module  →  ToolCategory / ContentSection  →  SlideItem
 *              (under Home)    (under Know More,    (within a section)
 *                               Tracker, etc.)
 */

/* ------------------------------------------------------------------ */
/*  Base types                                                         */
/* ------------------------------------------------------------------ */

/** Every content entity has a slug and a display title. */
export interface SlugEntity {
  slug: string;
  title: string;
  description?: string;
  order: number;
}

/** Supported embed media types */
export type MediaType = "google-slides" | "youtube" | "image" | "iframe";

/** A single embedded media reference */
export interface MediaEmbed {
  type: MediaType;
  url?: string;
  gurl?: string;
  yurl?: string;
  alt?: string;
  caption?: string;
}

/* ------------------------------------------------------------------ */
/*  Slide / Card system                                                */
/* ------------------------------------------------------------------ */

/** A column inside a slide — either text or media */
export interface ContentColumn {
  type: "text" | "media";
  /** HTML rich text when type = "text" */
  content?: string;
  /** Embedded media when type = "media" */
  media?: MediaEmbed;
}

/** A single slide/card that belongs to a ContentSection */
export interface SlideItem extends SlugEntity {
  sectionSlug: string;
  backgroundImage?: string;
  layout: "single" | "double";
  columns: ContentColumn[];
}

/* ------------------------------------------------------------------ */
/*  Content Sections (Know More, Tracker entries, etc.)                 */
/* ------------------------------------------------------------------ */

export interface SectionLink {
  label: string;
  url: string;
}

/**
 * A content section — the main reusable block.
 * Used for Know More items, Tracker entries, and any future modules.
 */
export interface ContentSection extends SlugEntity {
  /** Which module this section belongs to (e.g. "know-more", "tracker") */
  parentSlug: string;
  /** Author attribution (e.g. "Paulinne Clairre Borlagdan") */
  author?: string;
  /** Optional clickable URL for the author */
  authorUrl?: string;
  /** Rich text HTML body */
  content?: string;
  /** Embedded media attached directly to the section */
  media?: MediaEmbed[];
  /** External hyperlinks */
  links?: SectionLink[];
  /** Slide-based sub-content */
  slides?: SlideItem[];
  /** Grid span: 1 (default) or 2 (full width) */
  colSpan?: 1 | 2;
  /** CTA button */
  buttonLabel?: string;
  buttonUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Tool Categories (Home page)                                        */
/* ------------------------------------------------------------------ */

/** An individual tool/link */
export interface ToolItem extends SlugEntity {
  url: string;
  icon: string;
  categorySlug: string;
}

/** A tool category (Dashboard, Operations, etc.) */
export interface ToolCategory extends SlugEntity {
  /** Parent slug — "home" for top-level, or another category slug for nesting */
  parentSlug: string;
  tools: ToolItem[];
  /** Nested subcategories (slugs resolved at runtime) */
  subcategories?: string[];
}

/* ------------------------------------------------------------------ */
/*  Top-level Modules                                                  */
/* ------------------------------------------------------------------ */

export interface Module extends SlugEntity {
  href: string;
  display: string;
  /** Slugs of child categories or sections attached to this module */
  children?: string[];
  /** Optional nested navigation definitions for headers */
  subNav?: { display: string; href: string }[];
}

/* ------------------------------------------------------------------ */
/*  Legacy types — kept for Team page compatibility                    */
/* ------------------------------------------------------------------ */

export interface Member {
  name: string;
  image: string;
}

export interface Team {
  name: string;
  members: Member[];
}

export interface NavItem {
  label: string;
  href: string;
  display: string;
  subItems?: { display: string; href: string }[];
}
