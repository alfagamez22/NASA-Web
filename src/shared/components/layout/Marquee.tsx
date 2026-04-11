"use client";

import { MARQUEE_TEXT } from "@/infrastructure/config/constants";

// We render two identical tracks. The animation translates the outer container
// by -50% so that when the first track exits the viewport the second track
// (which is identical) is already in the exact same position, making the loop
// invisible.
const REPEAT = 6; // how many times the phrase repeats inside one track

export default function Marquee() {
  const items = Array.from({ length: REPEAT }, (_, i) => (
    <span key={i} className="marquee-text text-4xl mx-8 flex-shrink-0">
      {MARQUEE_TEXT}
    </span>
  ));

  return (
    <div
      className="overflow-hidden py-2 no-scrollbar"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-card) 100%)",
        borderTop: "2px solid var(--border-color)",
        borderBottom: "2px solid var(--border-color)",
        boxShadow: "0 0 15px var(--glow-color)",
        color: "var(--text-secondary)",
      }}
    >
      {/* The inner wrapper is twice as wide (two identical tracks).
          The keyframe slides it left by 50% (== one full track width)
          and then resets instantly — the reset is invisible because both
          tracks look the same. */}
      <div className="marquee-inner">
        <div className="marquee-track">{items}</div>
        {/* Aria-hidden duplicate so screen-readers don't double-read */}
        <div className="marquee-track" aria-hidden="true">
          {items}
        </div>
      </div>
    </div>
  );
}
