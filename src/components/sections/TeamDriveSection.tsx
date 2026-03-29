"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// --- URL CONFIGURATIONS ---
// Paste the actual destination URLs for each button below!
const BUTTON_URLS: Record<string, string> = {
  // SCRIPTS
  "NEW 2G Integration": "https://drive.google.com/drive/folders/1XWoy0a6zGIrOyCnEB81W0JEFWkIjb03Z?ogsrc=32",
  "IPCLOCK": "#",
  "NEW 3G Integration": "#",
  "NEIGHBOR": "#",
  "NEW EM Integration": "#",
  "HT CORE SCRIPT": "#",
  "NEW AC Integration": "#",
  "LTE 3 VLANS SCRIPT": "#",
  "NEW PC Integration": "#",
  "Project Calibre": "#",
  "OMU SCRIPT": "#",
  "IP MIGRATION SCRIPT": "#",

  // SHEETS
  "4G TRFS_CRFS": "#",
  "Integration Tracker [RIT]": "#",
  "RAN Engr Scheduler": "#",
  "Troubleshooting Logs [RATL]": "#",
  "LTE IP ROUTES": "#",
  "Integration Updates": "#",

  // SLIDES
  "Project Vortex": "#",
  "DIY PicoBTS INTEGRATION": "#",
  "Nokia MML & Alarms": "#",
  "RET ACTIVATION": "#"
};

const DRIVE_IFRAME_URL = "https://drive.google.com/...";
const RAN_CONFIG_PPM_URL = "https://drive.google.com/...";
// ----------------------------

export default function TeamDriveSection() {
  const scripts = [
    "NEW 2G Integration", "IPCLOCK",
    "NEW 3G Integration", "NEIGHBOR",
    "NEW EM Integration", "HT CORE SCRIPT",
    "NEW AC Integration", "LTE 3 VLANS SCRIPT",
    "NEW PC Integration", "Project Calibre",
    "OMU SCRIPT", "IP MIGRATION SCRIPT"
  ];

  const sheets = [
    "4G TRFS_CRFS", "Integration Tracker [RIT]",
    "RAN Engr Scheduler", "Troubleshooting Logs [RATL]",
    "LTE IP ROUTES", "Integration Updates"
  ];

  const slides = [
    "Project Vortex", "DIY PicoBTS INTEGRATION",
    "Nokia MML & Alarms", "RET ACTIVATION"
  ];

  const CategoryRow = ({ title, items }: { title: string, items: string[] }) => (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-8 relative z-10" style={{ borderColor: "var(--border-color)" }}>
      <div className="w-full md:w-64 pt-4 shrink-0 text-center md:text-right pr-4">
        <h3 className="font-display text-4xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-grow w-full max-w-4xl">
        {items.map((label) => (
          <Link
            key={label}
            href={BUTTON_URLS[label] || "#"}
            className="group relative flex items-center justify-center p-3 transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-nasa-blue/0 group-hover:bg-nasa-blue/20 transition-colors duration-300 rounded-lg" />
            <div className="nasa-card w-full text-center py-4 px-6 backdrop-blur-sm z-10">
              <span className="font-mono text-sm md:text-base font-bold text-nasa-gray group-hover:text-nasa-light-cyan uppercase transition-colors">{label}</span>
            </div>
            {/* Corner glowing accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-nasa-cyan group-hover:border-nasa-light-cyan transition-colors z-20" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-nasa-cyan group-hover:border-nasa-light-cyan transition-colors z-20" />
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen text-center py-16 overflow-hidden"
    >
      {/* Absolute Background image handling */}
      <div className="fixed inset-0 z-0 opacity-20 mix-blend-screen overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/server-rack.jpg')", filter: "contrast(1.2) brightness(0.8)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16 px-4">

        {/* Hero Title Block */}
        <div className="flex flex-col items-center justify-center mb-16 space-y-4">
          <p className="font-mono text-sm uppercase text-nasa-gray tracking-[0.2em] mb-4">
             // SYSTEM_CONNECT / NODE: RAN
          </p>
          <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter text-nasa-light-cyan" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--accent-color)" }}>
            TEAM DRIVE
          </h1>
          <div className="mt-8 px-12 py-3 border-4 border-dashed" style={{ borderColor: "var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}>
            <p className="font-display text-xl md:text-2xl uppercase tracking-widest text-nasa-gray">
              *** THIS PAGE IS FOR NOC RAN USERS ONLY ***
            </p>
          </div>
        </div>

        {/* Dynamic Category Rows */}
        <CategoryRow title="SCRIPTS:" items={scripts} />
        <CategoryRow title="SHEETS:" items={sheets} />
        <CategoryRow title="SLIDES:" items={slides} />

        {/* Embedded DRIVE Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-16 relative z-10 pt-8" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-full md:w-64 pt-4 shrink-0 text-center md:text-right pr-4">
            <h3 className="font-display text-4xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
              DRIVE:
            </h3>
          </div>
          <div className="flex-grow w-full max-w-3xl flex justify-center">
            <div className="w-full aspect-video overflow-hidden rounded-md flex items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
              <iframe
                src={DRIVE_IFRAME_URL}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay"
              />
              <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
            </div>
          </div>
        </div>

        {/* Embedded RAN Configuration PPM Section */}
        <div className="flex flex-col items-center justify-center w-full pt-16 relative z-10 space-y-12 pb-16">
          <h3 className="font-display text-4xl md:text-5xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
            RAN CONFIGURATION PPM
          </h3>
          <div className="w-full max-w-3xl aspect-video overflow-hidden rounded-md flex flex-col items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
            <iframe
              src={RAN_CONFIG_PPM_URL}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay"
            />
            <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
          </div>
        </div>

        {/* Footer Area with QR placeholder */}
        <div className="w-full max-w-5xl mx-auto border-t-[2px] pt-16 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 relative z-10 p-8 rounded-xl backdrop-blur-md" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
          <div className="text-left space-y-4">
            <p className="font-mono text-nasa-gray text-xs tracking-widest">NTG | OSCC | TAC | RAN</p>
            <p className="font-mono text-nasa-gray text-sm">We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX. Just SCAN or CLICK the QR Code.</p>
            <p className="font-mono text-nasa-cyan font-bold">Have a nice day!</p>
          </div>
          <div className="shrink-0 w-32 h-32 flex items-center justify-center rounded-lg border-2 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
            <span className="font-mono text-xs text-nasa-gray">QR Placeholder</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
