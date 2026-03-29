"use client";

import Image from "next/image";

interface TechCardProps {
  tech: string;
}

export default function TechCard({ tech }: TechCardProps) {
  const imageSrc = `/${tech.toLowerCase()}.jpg`;

  return (
    <div className="nasa-card relative flex flex-col items-center justify-center aspect-square overflow-hidden hover:bg-nasa-blue group cursor-pointer transition-colors duration-300" style={{ boxShadow: "0 0 15px var(--glow-color)" }}>
      <Image 
        src={imageSrc}
        alt={`${tech} Network Background`}
        fill
        className="object-cover opacity-30 mix-blend-luminosity group-hover:opacity-50 transition-opacity duration-300"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#00050a]/80 to-transparent z-0" />
      <span className="relative z-10 font-display text-6xl text-nasa-light-cyan drop-shadow-md shadow-cyan-900 group-hover:scale-110 transition-transform duration-300">{tech}</span>
    </div>
  );
}
