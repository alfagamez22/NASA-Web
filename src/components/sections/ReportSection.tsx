"use client";

import { motion } from "framer-motion";
import MediaEmbed from "@/components/content/MediaEmbed";

// --- CONFIGURATION ---
// Paste Google Slides URLs here to activate the embeds!
const SLIDES_URL_LEFT = "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25";
const SLIDES_URL_RIGHT = "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25";
const SLIDES_URL_BOTTOM = "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25";
// ---------------------

export default function ReportSection() {
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
        <h2 className="relative z-10 font-display text-7xl md:text-9xl uppercase tracking-tighter" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
          RAN REPORT
        </h2>
      </div>

      <div className="p-8 md:p-16 max-w-7xl mx-auto space-y-12">
        {/* Clickable Title Section */}
        <div
          className="border-y-4 py-6 cursor-pointer hover:bg-nasa-blue/20 transition-colors"
          style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <h3 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-center" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            OFFICIAL NETWORK PHYSICAL LOCATION COUNT
          </h3>
        </div>

        {/* Media Embed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Left Slide */}
          {SLIDES_URL_LEFT ? (
            <MediaEmbed media={{ type: "google-slides", gurl: SLIDES_URL_LEFT }} />
          ) : (
            <div className="nasa-card w-full h-[400px] flex items-center justify-center bg-black/20" style={{ border: "2px dashed var(--border-color)" }}>
              <span className="font-mono text-nasa-gray">EMPTY SLOT (LEFT)</span>
            </div>
          )}

          {/* Top Right Slide */}
          {SLIDES_URL_RIGHT ? (
            <MediaEmbed media={{ type: "google-slides", gurl: SLIDES_URL_RIGHT }} />
          ) : (
            <div className="nasa-card w-full h-[400px] flex items-center justify-center bg-black/20" style={{ border: "2px dashed var(--border-color)" }}>
              <span className="font-mono text-nasa-gray">EMPTY SLOT (RIGHT)</span>
            </div>
          )}

          {/* Bottom Full Span Slide */}
          <div className="md:col-span-2">
            {SLIDES_URL_BOTTOM ? (
              <MediaEmbed media={{ type: "google-slides", gurl: SLIDES_URL_BOTTOM }} />
            ) : (
              <div className="nasa-card w-full h-[400px] flex items-center justify-center bg-black/20" style={{ border: "2px dashed var(--border-color)" }}>
                <span className="font-mono text-nasa-gray">EMPTY SLOT (BOTTOM)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
