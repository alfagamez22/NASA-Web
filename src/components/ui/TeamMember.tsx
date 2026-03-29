"use client";

import Image from "next/image";
import type { Member } from "@/lib/types";

interface TeamMemberProps {
  member: Member;
  isHovered: boolean;
  onHover: (name: string | null) => void;
  variant?: "image" | "list";
}

export default function TeamMember({
  member,
  isHovered,
  onHover,
  variant = "image",
}: TeamMemberProps) {
  const isTL = member.name.includes("(TL)");

  if (variant === "list") {
    return (
      <li
        onMouseEnter={() => onHover(member.name)}
        onMouseLeave={() => onHover(null)}
        className={`p-3 transition-colors cursor-default ${
          isHovered
            ? "bg-nasa-blue text-nasa-light-cyan"
            : "bg-nasa-darker text-nasa-gray"
        } ${isTL ? "font-bold border-b-4" : "opacity-70"}`}
        style={{ 
          border: "1px solid var(--border-color)",
          borderBottomColor: isTL ? "var(--border-color-strong)" : "var(--border-color)"
        }}
      >
        {member.name}
      </li>
    );
  }

  return (
    <div
      className="aspect-[3/4] border-r-2 last:border-r-0 overflow-hidden relative group"
      style={{ borderColor: "var(--border-color)" }}
      onMouseEnter={() => onHover(member.name)}
      onMouseLeave={() => onHover(null)}
    >
      <Image
        src={member.image}
        alt={member.name}
        fill
        className={`object-cover transition-all duration-700 cursor-crosshair ${
          isHovered ? "grayscale-0 scale-110" : "grayscale"
        }`}
        referrerPolicy="no-referrer"
        unoptimized
      />
      {isTL && (
        <div className="absolute top-2 left-2 bg-nasa-blue text-nasa-light-cyan text-[10px] px-2 py-0.5 font-mono uppercase z-10" style={{ boxShadow: "0 0 10px var(--glow-color)" }}>
          TL
        </div>
      )}
    </div>
  );
}
