"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ToolCategory } from "@/lib/types";
import ToolCard from "./ToolCard";

interface CollapsibleCategoryProps {
  category: ToolCategory;
}

export default function CollapsibleCategory({ category }: CollapsibleCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`relative flex flex-col h-fit transition-all duration-500
        border-b md:border-b-0 md:border-r border-nasa-blue/20 last:border-r-0
        group ${isOpen ? "bg-nasa-blue/5" : "hover:bg-nasa-blue/5"}
      `}
      style={{
        flex: "1 1 0%",
        minWidth: "min-content",
      }}
    >
      {/* Category Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full p-6 md:p-8 text-left flex flex-col justify-center items-center gap-4 transition-all duration-300 overflow-hidden"
      >
        {/* Glow Background On Hover/Open */}
        <div className={`absolute inset-0 bg-gradient-to-b from-nasa-blue/10 to-transparent opacity-0 transition-opacity duration-500 ${isOpen ? "opacity-100" : "group-hover:opacity-60"}`} />

        {/* Scanning line removed per user request */}

        <div className="relative z-20 flex items-center justify-between w-full gap-2">
          <h3
            className="font-display uppercase tracking-widest leading-none whitespace-normal break-words text-center flex-1"
            style={{
              color: isOpen ? "var(--accent-color)" : "var(--text-secondary)",
              textShadow: isOpen ? "0 0 15px var(--glow-color)" : "none",
              fontSize: "clamp(0.85rem, 1.2vw, 1.5rem)",
              transition: "all 0.3s ease"
            }}
          >
            {category.title}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "anticipate" }}
            className="shrink-0"
          >
            <ChevronDown
              size={18}
              className={isOpen ? "text-nasa-cyan" : "text-nasa-gray group-hover:text-nasa-cyan"}
            />
          </motion.div>
        </div>

        {/* Category header indicator removed per user request */}
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-12 flex flex-col gap-3 relative z-20"
            >
              {category.tools
                .sort((a, b) => a.order - b.order)
                .map((tool) => (
                  <div
                    key={tool.slug}
                    className="transform transition-all duration-300 hover:scale-[1.02]"
                  >
                    <ToolCard tool={tool} />
                  </div>
                ))}
            </div>

            {/* Ambient Background Glow for Expanded State */}
            <div className="absolute inset-0 bg-gradient-to-b from-nasa-blue/5 to-transparent pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 768px) {
            :global(.tool-categories-wrapper) {
                overflow-x: hidden !important;
            }
        }
      `}</style>
    </div>
  );
}
