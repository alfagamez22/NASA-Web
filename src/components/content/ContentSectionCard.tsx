"use client";

import { ExternalLink } from "lucide-react";
import type { ContentSection } from "@/lib/types";
import MediaEmbed from "./MediaEmbed";

interface ContentSectionCardProps {
  section: ContentSection;
}

/**
 * Reusable content section card — renders a ContentSection as a styled card.
 *
 * Supports: title, author, description (rich text), external links,
 * embedded media, and CTA buttons. Used by Know More, Tracker, and
 * any future module that follows the same content pattern.
 */
export default function ContentSectionCard({ section }: ContentSectionCardProps) {
  const span = section.colSpan === 2 ? "md:col-span-2" : "";

  return (
    <div className={`nasa-card space-y-4 ${span}`}>
      {/* Title */}
      <h3
        className="font-display text-4xl uppercase"
        style={{ color: "var(--accent-color)" }}
      >
        {section.title}
      </h3>

      {/* Author */}
      {section.author && (
        <p
          className="font-mono text-sm uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          By{" "}
          {section.authorUrl ? (
            <a
              href={section.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              {section.author}
            </a>
          ) : (
            section.author
          )}
        </p>
      )}

      {/* Description / Rich text */}
      {section.description && (
        <div
          className="font-mono text-sm uppercase"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: section.description }}
        />
      )}

      {/* Rich text body content */}
      {section.content && (
        <div
          className="font-mono text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}

      {/* External links list */}
      {section.links && section.links.length > 0 && (
        <div className="space-y-2 font-mono text-sm uppercase">
          {section.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors"
              style={{ color: "var(--accent-color)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--accent-color)")
              }
            >
              <ExternalLink size={14} /> {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Embedded media */}
      {section.media &&
        section.media.length > 0 &&
        section.media.map((m, i) => (
          <MediaEmbed key={`${section.slug}-media-${i}`} media={m} />
        ))}

      {/* CTA button */}
      {section.buttonLabel && section.buttonUrl && (
        <a
          href={section.buttonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nasa-btn inline-block text-center"
        >
          {section.buttonLabel}
        </a>
      )}
    </div>
  );
}
