"use client";

import { motion } from "framer-motion";
import TechCard from "@/components/ui/TechCard";
import { TECH_TYPES } from "@/lib/constants";
import { getSectionsByParent } from "@/lib/content-service";
import ContentSectionCard from "@/components/content/ContentSectionCard";
import MediaEmbed from "@/components/content/MediaEmbed";

// --- CONFIGURATION ---
// To embed a Google Slide between the tech cards and the Login box, paste your URL below!
// Example: "https://docs.google.com/presentation/d/XXX/edit"
const ASGARD_SLIDES_URL = "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25";
// ---------------------

/**
 * Tracker page — ASGARD tracker with support for dynamic content sections.
 *
 * Content sections with parentSlug: "tracker" will appear below the legacy
 * ASGARD section. This gives Tracker the same rich content capabilities
 * as Know More (rich text, embeds, slides, etc.).
 */
export default function TrackerSection() {
  const trackerSections = getSectionsByParent("tracker");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 md:p-16 space-y-12 text-center"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="font-display text-8xl uppercase tracking-tighter" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--accent-color)" }}>
          ASGARD TRACKER
        </h2>
        <p className="font-mono text-xl uppercase p-4 inline-block" style={{ border: "2px solid var(--border-color-strong)", color: "var(--accent-color)" }}>
          SCC ASGARD: TRFS/CRFS SITE TRACKER
        </p>
        <p className="font-mono text-sm uppercase max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          TRACKERS ON THIS VORTEX WERE ALREADY MOVED TO OUR NEW ASGARD,
          EFFECTIVE OCT 14, 2019 (MON)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {TECH_TYPES.map((tech) => (
            <TechCard key={tech} tech={tech} />
          ))}
        </div>

        {/* Optional Embedded Slide Area */}
        {Boolean(ASGARD_SLIDES_URL) && (
          <div className="mt-12">
            <MediaEmbed
              media={{
                type: "google-slides",
                gurl: ASGARD_SLIDES_URL,
                caption: "Global ASGARD Tracker Guidelines"
              }}
            />
          </div>
        )}

        <div className="mt-12 p-8 space-y-6" style={{ border: "3px solid var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}>
          <h3 className="font-display text-3xl uppercase" style={{ color: "var(--accent-color)" }}>LOGIN TO ASGARD</h3>
          <p className="font-mono text-sm uppercase" style={{ color: "var(--text-secondary)" }}>
            Accessible ONLY via Citrix NEO connection
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="nasa-btn" onClick={() => window.open("https://www.google.com/url?q=https%3A%2F%2F10.244.2.130%2Fasgard-tracker%2F&sa=D&sntz=1&usg=AOvVaw3AaTjB0sbpIkvCzHnU4dvO")} style={{ backgroundColor: "var(--bg-secondary)" }}>
              LOGIN NOW
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic content sections — same system as Know More */}
      {trackerSections.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-8 text-left mt-16">
          <h3
            className="font-display text-5xl uppercase tracking-tighter pb-4"
            style={{
              borderBottom: "4px solid var(--border-color-strong)",
              textShadow: "0 0 10px var(--glow-color)",
              color: "var(--accent-color)",
            }}
          >
            TRACKER RESOURCES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trackerSections.map((section) => (
              <ContentSectionCard key={section.slug} section={section} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
