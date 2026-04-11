"use client";

import Image from "next/image";
import type { Member } from "@/shared/types";

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
  const isTL = /(TL|ATL)/i.test(member.name);

  if (variant === "list") {
    return (
      <li
        onMouseEnter={() => onHover(member.name)}
        onMouseLeave={() => onHover(null)}
        className={`p-4 transition-colors cursor-default ${
          isHovered
            ? "bg-nasa-blue text-nasa-light-cyan"
            : "bg-nasa-darker text-nasa-gray"
        } ${isTL ? "font-bold border-b-4" : "opacity-90"}`}
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
      className="aspect-[3/4] overflow-hidden relative group rounded-xl"
      style={{ border: "1px solid var(--border-color)" }}
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
      <div className="absolute inset-x-0 bottom-0 bg-black/70 text-sm text-nasa-light-cyan p-3 font-mono uppercase" style={{ backdropFilter: "blur(4px)" }}>
        {member.name}
      </div>
      {isTL && (
        <div className="absolute top-2 left-2 bg-nasa-blue text-nasa-light-cyan text-[10px] px-2 py-0.5 font-mono uppercase z-10" style={{ boxShadow: "0 0 10px var(--glow-color)" }}>
          TL
        </div>
      )}
    </div>
  );
}
