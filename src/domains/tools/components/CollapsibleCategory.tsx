"use client";

import type { ToolCategory, ToolItem } from "@/shared/types";
import { Edit2, Trash2 } from "lucide-react";
import ToolCard from "./ToolCard";

interface CollapsibleCategoryProps {
  category: ToolCategory;
  isEditMode?: boolean;
  onEditTool?: (tool: ToolItem) => void;
  onDeleteTool?: (tool: ToolItem) => void;
}

export default function CollapsibleCategory({ category, isEditMode, onEditTool, onDeleteTool }: CollapsibleCategoryProps) {
  return (
    <div
      className="relative flex flex-col h-fit transition-all duration-500 bg-nasa-blue/5 border-b md:border-b-0 md:border-r border-nasa-blue/20 last:border-r-0 group"
      style={{
        flex: "1 1 0%",
        minWidth: "min-content",
      }}
    >
      {/* Category Header */}
      <div className="relative w-full p-6 md:p-8 text-left flex flex-col justify-center items-center gap-4 transition-all duration-300 overflow-hidden">
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-nasa-blue/10 to-transparent opacity-100 transition-opacity duration-500" />

        <div className="relative z-20 flex items-center justify-center w-full gap-2">
          <h3
            className="font-display uppercase tracking-widest leading-none whitespace-normal break-words text-center flex-1"
            style={{
              color: "var(--accent-color)",
              textShadow: "0 0 15px var(--glow-color)",
              fontSize: "clamp(0.85rem, 1.2vw, 1.5rem)",
            }}
          >
            {category.title}
          </h3>
        </div>
      </div>

      {/* Content - Always Visible */}
      <div className="overflow-hidden">
        <div className="px-4 pb-12 flex flex-col gap-3 relative z-20">
          {category.tools
            .sort((a, b) => a.order - b.order)
            .map((tool) => (
              <div
                key={tool.slug}
                className="relative transform transition-all duration-300 hover:scale-[1.02] group/tool"
              >
                {isEditMode && (
                  <div className="absolute -top-1 -right-1 z-30 flex gap-0.5 opacity-0 group-hover/tool:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditTool?.(tool); }}
                      className="p-1 bg-black/80 text-cyan-400 hover:text-white rounded"
                      title="Edit Tool"
                    >
                      <Edit2 size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteTool?.(tool); }}
                      className="p-1 bg-black/80 text-red-400 hover:text-red-300 rounded"
                      title="Delete Tool"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
                <ToolCard tool={tool} />
              </div>
            ))}
        </div>

        {/* Ambient Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-nasa-blue/5 to-transparent pointer-events-none" />
      </div>

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
