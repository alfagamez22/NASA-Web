"use client";

import type { SlideItem } from "@/shared/types";
import MediaEmbed from "./MediaEmbed";

interface SlideCardProps {
  slide: SlideItem;
}

/**
 * Slide/Card renderer — displays a SlideItem with single or double column layout.
 *
 * Each column renders either rich text content or an embedded media element.
 * Supports optional background images.
 */
export default function SlideCard({ slide }: SlideCardProps) {
  const isDouble = slide.layout === "double";

  return (
    <div
      className="nasa-card space-y-4 relative"
      style={{
        backgroundImage: slide.backgroundImage
          ? `url(${slide.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay when background image is present */}
      {slide.backgroundImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(5, 10, 21, 0.85)" }}
        />
      )}

      <div className="relative z-10 space-y-4">
        {/* Slide header */}
        <h4
          className="font-display text-2xl uppercase"
          style={{ color: "var(--accent-color)" }}
        >
          {slide.title}
        </h4>

        {slide.description && (
          <div
            className="font-mono text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
            dangerouslySetInnerHTML={{ __html: slide.description }}
          />
        )}

        {/* Column layout */}
        <div
          className={`grid gap-6 ${
            isDouble ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {slide.columns.map((col, idx) => (
            <div key={`${slide.slug}-col-${idx}`} className="space-y-3">
              {col.type === "text" && col.content && (
                <div
                  className="font-mono text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                  dangerouslySetInnerHTML={{ __html: col.content }}
                />
              )}
              {col.type === "media" && col.media && (
                <MediaEmbed media={col.media} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
