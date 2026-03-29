"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TEAM_DATA } from "@/data/teams";
import TeamMember from "@/components/ui/TeamMember";
import { TEAM_EMAIL } from "@/lib/constants";

export default function TeamSection() {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 md:p-16 space-y-12"
    >
      <h2 className="font-display text-7xl uppercase tracking-tighter text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)", color: "var(--accent-color)" }}>
        THE TEAM
      </h2>

      <div className="space-y-16">
        {TEAM_DATA.map((team) => (
          <div key={team.name} className="space-y-6">
            <h3 className="font-display text-5xl uppercase text-nasa-light-cyan" style={{ borderBottom: "4px solid var(--border-color-strong)", paddingBottom: "0.5rem", color: "var(--accent-color)" }}>
              {team.name}
            </h3>

            {/* Dynamic Image Grid */}
            <div className="overflow-x-auto no-scrollbar" style={{ backgroundColor: "var(--bg-tertiary)", border: "2px solid var(--border-color)" }}>
              <div
                className="grid gap-0 min-w-[600px] md:min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${team.members.length}, 1fr)`,
                }}
              >
                {team.members.map((member) => (
                  <TeamMember
                    key={member.name}
                    member={member}
                    variant="image"
                    isHovered={hoveredMember === member.name}
                    onHover={setHoveredMember}
                  />
                ))}
              </div>
            </div>

            {/* Name List */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-sm uppercase">
              {team.members.map((member) => (
                <TeamMember
                  key={member.name}
                  member={member}
                  variant="list"
                  isHovered={hoveredMember === member.name}
                  onHover={setHoveredMember}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center p-8" style={{ border: "2px solid var(--border-color-strong)", backgroundColor: "var(--bg-card)" }}>
        <p className="font-mono text-lg uppercase text-nasa-cyan">Contact: {TEAM_EMAIL}</p>
      </div>
    </motion.div>
  );
}
