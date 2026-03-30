"use client";

import { motion } from "framer-motion";
import { getCategoriesByParent } from "@/lib/content-service";
import ToolCard from "@/components/ui/ToolCard";
import CollapsibleCategory from "@/components/ui/CollapsibleCategory";
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
      <div
        className="hero-banner relative min-h-[70vh] flex flex-col justify-center overflow-hidden"
        style={{ borderBottom: "2px solid var(--border-color)" }}
      >
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ objectPosition: "50% 20%" }}
        >
          <source src="/BACKGROUND.mp4" type="video/mp4" />
        </video>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: "linear-gradient(rgba(0, 5, 10, 0.6), rgba(0, 5, 10, 0.8))" }}
        />

        <div className="relative z-20 p-8 md:p-16">
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
      </div>

      {/* Marquee */}
      <Marquee />

      {/* Tool Categories Grid — dynamically loaded from content service */}
      <div className="tool-categories-wrapper w-full overflow-hidden bg-nasa-darker" style={{ borderBottom: "2px solid var(--border-color)" }}>
        {/* Animated Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.05, mixBlendMode: "overlay", zIndex: 0 }}
        >
          <source src="/SERVERRACKSBEHIND.mp4" type="video/mp4" />
        </video>

        {/* Blue Tint Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ backgroundColor: "rgba(0, 10, 20, 0.8)", mixBlendMode: "overlay", zIndex: 5 }}
        />

        <div className="scrollable-row relative z-10 flex flex-col md:flex-row transition-all duration-300 w-full no-scrollbar">
          {categories.map((category) => (
            <CollapsibleCategory key={category.slug} category={category} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .tool-categories-wrapper {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 2%,
            black 98%,
            transparent
          );
          position: relative;
          background-color: var(--bg-darker);
          z-index: 1;
        }

        .scrollable-row {
          /* Mobile View (≤768px) */
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0;
        }

        @media (min-width: 769px) {
          /* Desktop / Large Screens (≥1280px) and Small Laptops */
          .scrollable-row {
            flex-direction: row;
            flex-wrap: nowrap;
            overflow-x: auto; /* Fallback to scroll if they really don't fit */
            gap: clamp(4px, 0.5vw, 12px);
            padding: 0 2%; /* Reduced padding to maximize space */
          }
        }

        /* Enforce horizontal scroll when content overflows */
        .scrollable-row::-webkit-scrollbar {
          height: 4px;
        }
        .scrollable-row::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollable-row::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}
