"use client";

import { motion } from "framer-motion";
import { getCategoriesByParent } from "@/lib/content-service";
import ToolCard from "@/components/ui/ToolCard";
import Marquee from "@/components/layout/Marquee";
import { CONTACT_NUMBERS } from "@/lib/constants";

export default function HomeSection() {
  const categories = getCategoriesByParent("home");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-0"
    >
      {/* Hero Banner */}
      <div
        className="p-8 md:p-16 hero-banner relative min-h-[70vh] flex flex-col justify-center"
        style={{
          borderBottom: "2px solid var(--border-color)",
          backgroundImage: "linear-gradient(rgba(0, 5, 10, 0.6), rgba(0, 5, 10, 0.8)), url('/BACKGROUND.gif')",
          backgroundSize: "cover",
          // The first value is the X-axis (left to right), the second is the Y-axis (top to bottom).
          // Change "50%" to other values like "50% 20%" or "center top" or "100px -50px" to precisely shift the GIF!
          backgroundPosition: "50% 20%",
          backgroundRepeat: "no-repeat"
        }}
      >
        <h2
          className="font-display text-5xl md:text-7xl uppercase leading-none mb-4 hero-heading"
        >
          NETWORK ACCESS SERVICE &amp; ASSURANCE
        </h2>
        <p className="font-mono text-xl uppercase" style={{ color: "var(--accent-color)", textShadow: "0 0 8px var(--glow-color)" }}>
          DOMESTIC SERVICE OPERATION CENTER
        </p>
        <div className="mt-8 flex flex-wrap gap-4 font-mono text-sm">
          {CONTACT_NUMBERS.map(({ label, number }) => (
            <span
              key={label}
              className="px-3 py-1"
              style={{ border: "2px solid var(--border-color-strong)", color: "var(--text-primary)" }}
            >
              {label}: {number}
            </span>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <Marquee />

      {/* Tool Categories Grid — dynamically loaded from content service */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
        {categories.map((category, idx) => (
          <div
            key={category.slug}
            className={`p-8 ${idx !== categories.length - 1 ? "md:border-r-2" : ""
              } border-b-2 md:border-b-0`}
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3 className="font-display text-3xl mb-6 uppercase tracking-tighter" style={{ color: "var(--accent-color)", textShadow: "0 0 10px var(--glow-color)" }}>
              {category.title}
            </h3>
            <div className="space-y-3">
              {category.tools
                .sort((a, b) => a.order - b.order)
                .map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
