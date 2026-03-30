"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const VORTEX_CATEGORIES = [
  {
    title: "HOME",
    items: [
      "Activity Tracker",
      "RAN Hotlines",
      "NOC Web Tools",
      "NOC Shift Handover"
    ]
  },
  {
    title: "RAN REPORT",
    items: [
      "Official Network Count per PLA",
      "NE Count per BSC/RNC per REGION",
      "Site/Cell configuration parameters"
    ]
  },
  {
    title: "THE TEAM",
    items: [
      "RAN Engineers",
      "TEAM DRIVE (Exclusive for NOC RAN use only)",
      "Inside VORTEX"
    ]
  },
  {
    title: "KNOW MORE",
    items: [
      "Videos / Slides / Chart Presentations"
    ]
  },
  {
    title: "TRACKER",
    items: [
      "For newly integrated sites",
      "TRFS and CRFS Dates",
      "Site count per year"
    ]
  },
  {
    title: "ALARM LIBRARY",
    items: [
      "Alarm troubleshooting guide"
    ]
  }
];

const TEAM_CREDITS = [
  { name: "JEROME, Admin 1", role: "Vortex Updates, Trackers" },
  { name: "JHOANNA, Admin 2", role: "TeamDrive, Scripts, Survey" },
  { name: "JONARD, Admin 3", role: "RAN Report" },

  { name: "ANNA, PPM Documentation", role: "Alarm Library, PPM Documentations" },
  { name: "GUS, PPM Documentation", role: "PPM Documentations" },
  { name: "SETTE, PPM Documentation", role: "PPM Documentations" },

  { name: "REZIEL, RAN Report Update", role: "Group List Updates" },
  { name: "NICO, NE Listing", role: "List of NEs per BSC/RNC" },

  { name: "ARMI, PPM TL", role: "PPM TL Approver" },
  { name: "MYLA, PPM TL", role: "PPM TL Approver" },

  { name: "PAU, Knowledge Management", role: "NTG Contacts Directory, Know More Presentations" },
  { name: "GRACE, Knowledge Management", role: "PPM Documentations, Know More Presentations" },
  { name: "ELAINE, Knowledge Management", role: "KnowMore Presentations" },

  { name: "FERNAND, Tracker QA", role: "TRFS Tracker Checker" },
  { name: "GILBERT, Monitoring", role: "SLCK/MODIF Monitoring" },
  { name: "EDH, RAN Report Update", role: "Site Report Updates" },
];

const HEADER_OFFSET = 72;
const STEP_HEIGHT_VH = 100; // Total scroll distance per layer
const TOTAL_LAYERS = 3; // Layer 0: Hero, Layer 1: Directory, Layer 2: Credits

function clampIndex(value: number, max: number) {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

export default function InsideVortexSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Background Transitions based directly on the container scroll progress
  // At progress 0 (top), Laserflow is visible.
  // At progress > 0.3, Milkyway fades in.
  const entryBlend = useSpring(
    useTransform(sectionProgress, [0, 0.4], [0, 1]),
    { stiffness: 120, damping: 28 }
  );

  const laserflowOpacity = useSpring(
    useTransform(entryBlend, [0, 1], [1, 0]),
    { stiffness: 120, damping: 28 }
  );
  const milkywayOpacity = useSpring(entryBlend, {
    stiffness: 120,
    damping: 28,
  });

  useMotionValueEvent(sectionProgress, "change", (latest) => {
    // Snap layer 0, 1, or 2 based on scroll progress threshold
    const nextIndex = clampIndex(
      Math.round(latest * (TOTAL_LAYERS - 1)),
      TOTAL_LAYERS - 1
    );
    setActiveIndex(nextIndex);
  });

  return (
    <div className="relative isolate w-full">
      {/* Hide the global window scrollbar strictly on this cinematic page to prevent it from slicing through the Header/Footer */}
      <style dangerouslySetInnerHTML={{
        __html: `
        body::-webkit-scrollbar { display: none !important; }
        body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}} />

      {/* 
        We render the scroll container with exactly enough height to trigger the 3 states.
        300vh means scrolling down 2 screen heights transitions us through Directory to Credits.
      */}
      <section
        ref={sectionRef}
        className="relative"
        style={{ minHeight: `${TOTAL_LAYERS * STEP_HEIGHT_VH}vh` }}
      >
        {/* Sticky viewport that stays on screen while scrolling through the extra height */}
        <div
          className="sticky w-full overflow-hidden"
          style={{
            top: `${HEADER_OFFSET}px`,
            height: `calc(100vh - ${HEADER_OFFSET}px)`,
          }}
        >
          {/* Dynamic Backgrounds */}
          <motion.div
            className="absolute inset-0 z-0 bg-nasa-darker"
            style={{ opacity: laserflowOpacity }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-[50%_100%]"
            >
              <source src="/laserflow.webm" type="video/webm" />
            </video>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(1, 5, 12, 0.48) 0%, rgba(1, 5, 12, 0.78) 100%)",
              }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 z-0 bg-nasa-darker"
            style={{ opacity: milkywayOpacity }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-center"
            >
              <source src="/MILKYWAY.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at top, rgba(18, 64, 96, 0.16) 0%, rgba(0, 0, 0, 0) 42%), linear-gradient(180deg, rgba(2, 5, 12, 0.4) 0%, rgba(2, 5, 12, 0.75) 100%)",
              }}
            />
          </motion.div>

          {/* Interactive Content Layers */}
          <div className="absolute inset-0 z-10">
            <AnimatePresence initial={false} mode="wait">
              {activeIndex === 0 && (
                /* HERO LAYER */
                <motion.div
                  key="hero-layer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col items-center justify-center px-6 md:px-10"
                >
                  <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
                    <p
                      className="font-mono text-xs uppercase tracking-[0.45em] text-nasa-gray md:text-sm"
                      style={{ color: "var(--accent-color)" }}
                    >
                      // ENTER THE VORTEX DEPTH MAP
                    </p>
                    <h1
                      className="font-display text-5xl uppercase tracking-tight md:text-7xl lg:text-8xl"
                      style={{
                        color: "var(--text-primary)",
                        textShadow: "0 0 20px rgba(0,212,255,0.2)",
                      }}
                    >
                      WHAT&apos;S INSIDE THE{" "}
                      <span
                        style={{
                          color: "var(--accent-color)",
                          textShadow: "0 0 24px var(--glow-color)",
                        }}
                      >
                        VORTEX
                      </span>
                    </h1>
                    <div className="nasa-card max-w-3xl text-center">
                      <p
                        className="font-mono text-sm uppercase leading-relaxed md:text-base tracking-[0.1em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Scroll down to enter the core modules, operational
                        references, and structural depths of the portal.
                      </p>
                    </div>
                    {/* Scroll Indicator */}
                    <div
                      className="mt-6 flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: "var(--accent-light)" }}
                    >
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-12 w-6 justify-center rounded-full border-2 p-1.5"
                        style={{
                          borderColor: "var(--border-color-strong)",
                          background: "rgba(5, 10, 21, 0.6)",
                        }}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full bg-[var(--accent-color)]"
                          style={{ boxShadow: "0 0 8px var(--glow-color)" }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeIndex === 1 && (
                /* DIRECTORY LAYER */
                <motion.div
                  key="directory-layer"
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -40 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col justify-center px-6 md:px-10 overflow-y-auto py-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div className="mx-auto max-w-7xl flex flex-col gap-10 w-full pt-8 md:pt-0">
                    {/* Directory Header Title */}
                    <div className="text-center space-y-4 shrink-0">
                      <h2
                        className="font-display text-4xl uppercase tracking-tight md:text-5xl"
                        style={{ color: "var(--text-primary)" }}
                      >
                        VORTEX{" "}
                        <span
                          style={{
                            color: "var(--accent-light)",
                            textShadow: "0 0 18px var(--glow-color)",
                          }}
                        >
                          DIRECTORY
                        </span>
                      </h2>
                      <div className="w-24 h-[2px] bg-[var(--accent-color)] mx-auto rounded-full shadow-[0_0_12px_var(--glow-color)]" />
                    </div>

                    {/* Subpage Grid of Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full pb-8">
                      {VORTEX_CATEGORIES.map((category, idx) => (
                        <motion.div
                          key={category.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                          className="nasa-card flex flex-col h-full hover:-translate-y-1 transition-transform duration-300"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(5, 10, 21, 0.75) 0%, rgba(2, 5, 12, 0.95) 100%)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid var(--border-color-strong)",
                          }}
                        >
                          {/* Card Title Header */}
                          <div className="border-b-[1px] border-[var(--border-color)] pb-3 mb-5">
                            <p
                              className="font-mono text-[10px] uppercase tracking-[0.3em] mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              // Subsystem Layer
                            </p>
                            <h3
                              className="font-display text-2xl uppercase tracking-tighter"
                              style={{
                                color: "var(--accent-color)",
                                textShadow: "0 0 12px rgba(0,212,255,0.15)",
                              }}
                            >
                              {category.title}
                            </h3>
                          </div>

                          {/* Information List Items */}
                          <ul className="flex flex-col gap-4 flex-grow">
                            {category.items.map((item) => (
                              <li key={item} className="flex items-start gap-4">
                                <span
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[var(--accent-light)] transition-all duration-300 group-hover:bg-[var(--accent-color)]"
                                  style={{ boxShadow: "0 0 8px var(--glow-color)" }}
                                />
                                <span
                                  className="font-mono text-sm uppercase leading-relaxed text-left"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeIndex === 2 && (
                /* CREDITS LAYER */
                <motion.div
                  key="credits-layer"
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -40 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col justify-center px-6 md:px-10 py-12"
                >
                  <div className="mx-auto flex flex-col items-center justify-center gap-12 w-full max-w-6xl">
                    <div className="text-center w-full max-w-4xl mx-auto space-y-2 pb-6 border-b border-[rgba(0,212,255,0.15)]">
                      <h2 className="font-mono text-xl md:text-2xl uppercase tracking-[0.5em] text-nasa-light-cyan" style={{ color: "var(--text-primary)", textShadow: "0 0 15px rgba(255,255,255,0.2)" }}>
                         ///BEHIND VORTEX_
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 w-full max-w-6xl mx-auto">
                      {TEAM_CREDITS.map((credit, idx) => (
                        <div key={idx} className="flex items-baseline w-full gap-3 group">
                          {/* Left: Name */}
                          <span className="shrink-0 font-display uppercase tracking-widest text-sm md:text-base whitespace-nowrap" style={{ color: "var(--text-primary)", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}>
                            {credit.name}
                          </span>

                          {/* Middle: Expanding Line */}
                          <div className="flex-1 border-b border-[rgba(255,255,255,0.15)] group-hover:border-[var(--accent-color)] transition-colors duration-300 min-w-[30px] opacity-70 relative top-[-4px]" />

                          {/* Right: Role */}
                          <div className="flex shrink text-right max-w-[55%] lg:max-w-[45%]">
                            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] inline-block w-full" style={{ color: "var(--accent-color)" }}>
                              {credit.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
