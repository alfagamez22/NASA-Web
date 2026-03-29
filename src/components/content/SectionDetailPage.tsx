"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ContentSection, Module } from "@/lib/types";
import ContentSectionCard from "./ContentSectionCard";
import SlideCard from "./SlideCard";
import { buildBreadcrumb } from "@/lib/slug-utils";

interface SectionDetailPageProps {
  section: ContentSection;
  parentModule: Module;
}

/**
 * Full-page detail view for a content section.
 *
 * Reached via slug routes like /know-more/ran-functions-and-limitations.
 * Shows the section card at the top, followed by its slides if any.
 */
export default function SectionDetailPage({
  section,
  parentModule,
}: SectionDetailPageProps) {
  const breadcrumbs = buildBreadcrumb([parentModule.slug, section.slug], {
    [parentModule.slug]: parentModule.display,
    [section.slug]: section.title,
  });

  const slides = section.slides ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 md:p-16 space-y-12"
    >
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 font-mono text-sm uppercase">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {i > 0 && (
              <span style={{ color: "var(--text-secondary)" }}>/</span>
            )}
            {i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="transition-colors"
                style={{ color: "var(--accent-color)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--accent-light)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--accent-color)")
                }
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--text-primary)" }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Back link */}
      <Link
        href={parentModule.href}
        className="inline-flex items-center gap-2 font-mono text-sm uppercase transition-colors"
        style={{ color: "var(--accent-color)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--accent-light)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--accent-color)")
        }
      >
        <ArrowLeft size={16} />
        BACK TO {parentModule.display}
      </Link>

      {/* Section content */}
      <ContentSectionCard section={section} />

      {/* Slides */}
      {slides.length > 0 && (
        <div className="space-y-8">
          <h3
            className="font-display text-3xl uppercase tracking-tighter"
            style={{
              color: "var(--accent-color)",
              borderBottom: "2px solid var(--border-color-strong)",
              paddingBottom: "0.5rem",
            }}
          >
            CONTENT SLIDES
          </h3>
          <div className="space-y-6">
            {slides
              .sort((a, b) => a.order - b.order)
              .map((slide) => (
                <SlideCard key={slide.slug} slide={slide} />
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
