"use client";

import { motion } from "framer-motion";
import { getSectionsByParent } from "@/lib/content-service";
import SlideCard from "@/components/content/SlideCard";
import TBAReport from "@/components/sections/TBAReport";

interface RegionalReportSectionProps {
  reportType: string;
  moduleSlug: string;
}

export default function RegionalReportSection({ reportType, moduleSlug }: RegionalReportSectionProps) {
  const regions = getSectionsByParent(moduleSlug);

  if (regions.length === 0) {
    return <TBAReport title={`${reportType} REPORT`} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0 text-center"
    >
      {/* Hero Banner */}
      <div 
        className="p-8 md:p-16 relative flex flex-col items-center justify-center min-h-[30vh]"
        style={{ 
          borderBottom: "2px solid var(--border-color)",
          background: "linear-gradient(to bottom, rgba(5,15,30,0.6), rgba(5,15,30,0.9))",
        }}
      >
        {/* Optional background image hook: you can add url('/your-bg.jpg') to the background property above */}
        <h2 className="relative z-10 font-display text-7xl md:text-9xl uppercase tracking-tighter" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
          {reportType} REPORT
        </h2>
      </div>

      <div className="max-w-7xl mx-auto space-y-16 py-12 px-4 md:px-8">
        {regions.map((region) => (
          <div key={region.slug} className="space-y-8">
            {/* Region Title Bar */}
            <div 
              className="py-4 border-y-4"
              style={{ borderColor: "var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}
            >
              <h3 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-center tracking-wide" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)", color: "var(--text-primary)" }}>
                {region.title}
              </h3>
            </div>

            {/* Slides/Entries for this region */}
            <div className="space-y-8 flex flex-col items-center">
              {region.slides?.map((slide) => (
                <div key={slide.slug} className="w-full">
                  <SlideCard slide={slide} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
