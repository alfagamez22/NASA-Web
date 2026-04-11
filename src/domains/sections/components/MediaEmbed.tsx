"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import type { MediaEmbed as MediaEmbedType } from "@/shared/types";

interface MediaEmbedProps {
  media: MediaEmbedType;
  className?: string;
}

/**
 * Universal media renderer — handles Google Slides, YouTube, images, and
 * generic iframes. Drop this into any layout column or section.
 */
export default function MediaEmbed({ media, className = "" }: MediaEmbedProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Normalize DB type (stored with underscore) back to hyphen form
  const mediaType = (media.type as string)?.replace(/_/g, "-") as typeof media.type;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  };
  const closeZoom = () => {
    setIsZoomed(false);
    // Reset after animation resolves
    setTimeout(() => setZoomLevel(1), 300);
  };

  const wrapperStyle = {
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    overflow: "hidden" as const,
  };

  switch (mediaType) {
    case "google-slides": {
      let slideUrl = media.gurl || media.url || "";
      if (slideUrl.includes("/edit") || slideUrl.includes("/preview")) {
        slideUrl = slideUrl.replace(/\/(edit|preview).*/, "/embed?start=false&loop=false&delayms=3000");
      }

      return (
        <div className={`w-full ${className}`} style={wrapperStyle}>
          <iframe
            src={slideUrl}
            title={media.alt ?? "Google Slides Embed"}
            className="w-full"
            style={{ height: "400px", border: "none" }}
            allowFullScreen
          />
          {media.caption && (
            <p
              className="font-mono text-xs uppercase px-3 py-2"
              style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}
            >
              {media.caption}
            </p>
          )}
        </div>
      );
    }

    case "youtube": {
      // Extract video ID from various YouTube URL formats
      let ytUrl = media.yurl || media.url || "";
      const videoId = extractYouTubeId(ytUrl);
      const embedUrl = videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : ytUrl;

      return (
        <div className={`w-full max-w-5xl mx-auto ${className}`} style={wrapperStyle}>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              title={media.alt ?? "YouTube Video"}
              className="absolute inset-0 w-full h-full"
              style={{ border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {media.caption && (
            <p
              className="font-mono text-xs uppercase px-3 py-2"
              style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}
            >
              {media.caption}
            </p>
          )}
        </div>
      );
    }

    case "image":
      return (
        <>
          <div className={`w-full group ${className}`} style={wrapperStyle}>
            <div 
              className="relative w-full cursor-zoom-in shrink-0" 
              style={{ minHeight: "400px" }}
              onClick={() => setIsZoomed(true)}
            >
              <Image
                src={media.url || ""}
                alt={media.alt ?? "Image"}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                <ZoomIn className="text-white drop-shadow-md" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }} size={48} />
              </div>
            </div>
            {media.caption && (
              <p
                className="font-mono text-xs uppercase px-3 py-2"
                style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}
              >
                {media.caption}
              </p>
            )}
          </div>

          {/* Lightbox Overlay */}
          {isZoomed && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              {/* Controls */}
              <div className="absolute top-6 right-6 flex gap-4 z-50">
                <button 
                  onClick={handleZoomOut} 
                  className="p-3 bg-nasa-darker text-white rounded hover:bg-nasa-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={zoomLevel <= 1}
                  title="Zoom Out"
                >
                  <ZoomOut size={24} />
                </button>
                <button 
                  onClick={handleZoomIn} 
                  className="p-3 bg-nasa-darker text-white rounded hover:bg-nasa-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={zoomLevel >= 4}
                  title="Zoom In"
                >
                  <ZoomIn size={24} />
                </button>
                <button 
                  onClick={closeZoom} 
                  className="p-3 bg-red-900/80 text-white rounded hover:bg-red-700 transition-colors"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Container for the Image */}
              <div 
                className="w-full h-full overflow-auto flex px-4 pb-4 pt-24 cursor-zoom-out" 
                onClick={closeZoom}
              >
                <div 
                  className="relative transition-all duration-300 ease-in-out flex-shrink-0 cursor-default m-auto"
                  style={{ 
                    width: `${90 * zoomLevel}vw`,
                    height: `${90 * zoomLevel}vh`,
                  }}
                  onClick={(e) => e.stopPropagation()} // Keep image click from closing
                >
                  <Image
                    src={media.url || ""}
                    alt={media.alt ?? "Expanded Image"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          )}
        </>
      );

    case "iframe":
      return (
        <div className={`w-full ${className}`} style={wrapperStyle}>
          <iframe
            src={media.url || ""}
            title={media.alt ?? "Embedded Content"}
            className="w-full"
            style={{ height: "400px", border: "none" }}
            allowFullScreen
          />
          {media.caption && (
            <p
              className="font-mono text-xs uppercase px-3 py-2"
              style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)" }}
            >
              {media.caption}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

/** Extract YouTube video ID from common URL formats */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
