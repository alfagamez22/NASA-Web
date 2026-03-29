"use client";

import { motion } from "framer-motion";

interface TBAReportProps {
  title: string;
}

export default function TBAReport({ title }: TBAReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0 text-center flex flex-col items-center justify-center min-h-[70vh] p-8"
    >
      <h2 className="relative z-10 font-display text-6xl md:text-8xl uppercase tracking-tighter mb-12" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
        {title}
      </h2>
      <div className="p-16 border-4 border-dashed max-w-4xl w-full" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
        <h3 className="font-display text-5xl md:text-7xl uppercase text-nasa-gray">
          [ TBA ]
        </h3>
        <p className="mt-6 font-mono text-nasa-gray text-xl uppercase">
          Detailed metrics, charts, and content for {title} are currently under construction.
        </p>
      </div>
    </motion.div>
  );
}
