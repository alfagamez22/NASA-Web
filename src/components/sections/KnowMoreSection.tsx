"use client";

import { motion } from "framer-motion";
import { getSectionsByParent } from "@/lib/content-service";
import ContentSectionCard from "@/components/content/ContentSectionCard";

/**
 * Know More page — lists all content sections under the "know-more" module.
 *
 * Each section is rendered using the reusable ContentSectionCard component.
 * To add a new entry, add an object to sections.json with parentSlug: "know-more".
 */
export default function KnowMoreSection() {
  const sections = getSectionsByParent("know-more");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 md:p-16 space-y-12"
    >
      <h2
        className="font-display text-7xl uppercase tracking-tighter pb-4"
        style={{
          borderBottom: "4px solid var(--border-color-strong)",
          textShadow: "0 0 10px var(--glow-color)",
          color: "var(--accent-color)",
        }}
      >
        KNOW MORE ABOUT...
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => (
          <ContentSectionCard key={section.slug} section={section} />
        ))}
      </div>
    </motion.div>
  );
}
