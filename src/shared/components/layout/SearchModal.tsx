"use client";

import { useState, useEffect, useCallback } from "react";
import ToolCard from "@/domains/tools/components/ToolCard";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolItem = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionItem = any;

/**
 * Search modal — searches across all tools and content sections.
 */
export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [allSections, setAllSections] = useState<SectionItem[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [toolsRes, sectionsRes] = await Promise.all([
        fetch("/api/tools"),
        fetch("/api/sections"),
      ]);
      if (toolsRes.ok) setAllTools(await toolsRes.json());
      if (sectionsRes.ok) setAllSections(await sectionsRes.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  const filteredTools = allTools.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSections = allSections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.author ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = filteredTools.length > 0 || filteredSections.length > 0;

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset query when closed
  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-nasa-darker flex items-center justify-center p-4" 
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between pb-4 text-nasa-light-cyan" style={{ borderBottom: "4px solid var(--border-color-strong)", color: "var(--text-primary)" }}>
          <input
            autoFocus
            type="text"
            placeholder="SEARCH VORTEX..."
            className="bg-transparent font-display text-5xl md:text-7xl uppercase w-full outline-none text-nasa-light-cyan placeholder-nasa-gray"
            style={{
              backgroundColor: "transparent",
              color: "var(--text-primary)"
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="font-display text-4xl hover:text-nasa-cyan px-4 py-2 transition-colors text-nasa-light-cyan"
            style={{ color: "var(--text-primary)" }}
          >
            [X]
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
          {/* Tool results */}
          {searchQuery && filteredTools.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>
                TOOLS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} variant="search" />
                ))}
              </div>
            </div>
          )}

          {/* Section results */}
          {searchQuery && filteredSections.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>
                CONTENT
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSections.map((section) => (
                  <a
                    key={section.slug}
                    href={`/${section.parentSlug}/${section.slug}`}
                    className="group flex items-center justify-between p-6 hover:bg-nasa-blue hover:bg-opacity-60 transition-colors text-nasa-gray hover:text-nasa-light-cyan rounded"
                    style={{ border: "1px solid var(--border-color)" }}
                  >
                    <div>
                      <span className="font-bold text-xl uppercase block" style={{ color: "var(--accent-color)" }}>
                        {section.title}
                      </span>
                      {section.author && (
                        <span className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
                          By {section.author}
                        </span>
                      )}
                      {section.description && !section.author && (
                        <span className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
                          {section.description}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery && !hasResults && (
            <p className="font-mono text-xl uppercase col-span-2 text-center py-12" style={{ color: "var(--text-secondary)" }}>
              NO RESULTS FOUND FOR &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          {/* Empty state */}
          {!searchQuery && (
            <p className="font-mono text-xl uppercase col-span-2 text-center py-12" style={{ color: "var(--text-secondary)" }}>
              START TYPING TO SEARCH...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
