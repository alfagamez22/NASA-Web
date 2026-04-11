"use client";

import { motion } from "framer-motion";

interface TBAReportProps {
  title: string;
  videoSrc?: string;
  overlayOpacity?: number;
  objectPosition?: string;
}

export default function TBAReport({ 
  title, 
  videoSrc, 
  overlayOpacity = 0.5,
  objectPosition = "center"
}: TBAReportProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative space-y-0 text-center flex flex-col items-center justify-center min-h-[80vh] p-8 overflow-hidden"
    >
      {/* Background Video Layer */}
      {videoSrc && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ objectPosition }}
          >
            <source src={videoSrc} type={videoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          </video>
          <div 
            className="absolute inset-0 z-10" 
            style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
          />
        </>
      )}

      <div className="relative z-20 flex flex-col items-center justify-center w-full">
        <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-widest mb-12" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
          {title}
        </h2>
        <div className="p-12 md:p-16 border-2 border-dashed max-w-4xl w-full backdrop-blur-sm" style={{ borderColor: "var(--border-color)", backgroundColor: "rgba(10, 15, 25, 0.7)" }}>
          <h3 className="font-display text-4xl md:text-6xl uppercase text-nasa-gray">
            [ TBA ]
          </h3>
          <p className="mt-6 font-mono text-nasa-gray text-lg md:text-xl uppercase tracking-wider">
            Detailed metrics, charts, and content for {title} are currently under construction.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
