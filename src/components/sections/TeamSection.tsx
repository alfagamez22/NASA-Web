"use client";

import { motion } from "framer-motion";
import { TEAM_EMAIL } from "@/lib/constants";

// ─── Org Data ────────────────────────────────────────────────────────────────

const SPINE = [
  {
    name: "Yoke Kong Seow",
    role: "Network Technical",
    img: "https://picsum.photos/seed/yoke/400/500",
  },
  {
    name: "Cristino Crisostomo",
    role: "Network Operations and Assurance",
    img: "https://picsum.photos/seed/cristino/400/500",
  },
  {
    name: "Matthew Slee",
    role: "Tier 1 Operations",
    img: "https://picsum.photos/seed/matthew/400/500",
  },
  {
    name: "Aliver Dimacisil",
    role: "Head — DSOC",
    img: "https://picsum.photos/seed/aliver/400/500",
  },
  {
    name: "Neil Chester Soria",
    role: "Head — NASA",
    img: "https://picsum.photos/seed/neil/400/500",
  },
];

const TEAMS = [
  {
    id: 1,
    label: "NASA Team 1",
    head: { name: "Girlie Quitalig", img: "https://picsum.photos/seed/girlie/400/500" },
    tls: [
      { name: "Catherine Eustaquio", img: "https://picsum.photos/seed/catherine/400/500" },
      { name: "Jerome Quirona", img: "https://picsum.photos/seed/jerome/400/500" },
    ],
    atls: [
      { name: "Charisa Laguna", img: "https://picsum.photos/seed/charisa/400/500" },
      { name: "Charisse Ortiz Luis-Formoso", img: "https://picsum.photos/seed/charisse/400/500" },
    ],
    engineers: [
      { name: "Rose Marie Arvesu Bacalzo", img: "https://picsum.photos/seed/rose/400/500" },
      { name: "Precious Regina Breto", img: "https://picsum.photos/seed/precious/400/500" },
      { name: "Ma. Ellarie Ann Alday", img: "https://picsum.photos/seed/ellarie/400/500" },
      { name: "Jose H. Montenegro V", img: "https://picsum.photos/seed/jose/400/500" },
      { name: "Mc Genesis Blazo", img: "https://picsum.photos/seed/genesis/400/500" },
      { name: "Ronico Cunanan", img: "https://picsum.photos/seed/ronico/400/500" },
    ],
  },
  {
    id: 2,
    label: "NASA Team 2",
    head: { name: "Armilene Marquez", img: "https://picsum.photos/seed/armilene/400/500" },
    tls: [
      { name: "Gilbert Reyes", img: "https://picsum.photos/seed/gilbert/400/500" },
      { name: "Fernand Loretizo", img: "https://picsum.photos/seed/fernand/400/500" },
    ],
    atls: [
      { name: "Mary Grace Bautista", img: "https://picsum.photos/seed/marygrace/400/500" },
      { name: "Laarni Marquez", img: "https://picsum.photos/seed/laarni/400/500" },
    ],
    engineers: [
      { name: "Danilo Ricafrente", img: "https://picsum.photos/seed/danilo/400/500" },
      { name: "Jeizel Concepcion", img: "https://picsum.photos/seed/jeizel/400/500" },
      { name: "Bryan Gervacio Bolivar", img: "https://picsum.photos/seed/bryan/400/500" },
      { name: "Rachel Ann Caigas", img: "https://picsum.photos/seed/rachel/400/500" },
      { name: "Fressie Ritz Gosilatar", img: "https://picsum.photos/seed/fressie/400/500" },
      { name: "Mary Grace Silfavan", img: "https://picsum.photos/seed/silfavan/400/500" },
    ],
  },
];

// ─── Shared connector ────────────────────────────────────────────────────────

function VLine({ h = "h-10" }: { h?: string }) {
  return <div className={`w-px ${h} bg-cyan-500/30 mx-auto flex-shrink-0`} />;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="w-full text-[10px] font-mono text-cyan-400/50 uppercase tracking-[0.25em] border-b border-cyan-500/15 pb-1.5 mb-3">
      {label}
    </p>
  );
}

// ─── Card components ─────────────────────────────────────────────────────────

/** Top-of-spine portrait card — large */
function SpineCard({ name, role, img }: { name: string; role: string; img: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl w-64 flex-shrink-0 group"
      style={{ border: "1px solid rgba(0,255,255,0.25)" }}
    >
      <div className="h-56 overflow-hidden">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 cursor-crosshair"
          referrerPolicy="no-referrer"
        />
      </div>
      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold uppercase tracking-wider text-sm leading-snug">{name}</p>
        <p className="text-cyan-400/70 text-[11px] font-mono mt-0.5">{role}</p>
      </div>
    </div>
  );
}

/** Team Head — full-width tall portrait card */
function TeamHeadCard({ name, img }: { name: string; img: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl w-full group"
      style={{
        border: "2px solid rgba(0,255,255,0.45)",
        boxShadow: "0 0 28px rgba(0,255,255,0.1)",
      }}
    >
      <div className="h-72 overflow-hidden">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 cursor-crosshair"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" />
      <div className="absolute top-3 left-3">
        <span
          className="text-[10px] font-mono text-cyan-300 px-2.5 py-1 rounded"
          style={{
            background: "rgba(0,255,255,0.15)",
            border: "1px solid rgba(0,255,255,0.4)",
            boxShadow: "0 0 8px rgba(0,255,255,0.2)",
          }}
        >
          TEAM HEAD
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold uppercase tracking-wider text-base leading-snug">{name}</p>
      </div>
    </div>
  );
}

/** TL / ATL portrait card — 2-col grid */
function RoleCard({ name, badge, img }: { name: string; badge: "TL" | "ATL"; img: string }) {
  const isTL = badge === "TL";
  return (
    <div
      className="relative overflow-hidden rounded-lg group"
      style={{
        border: `1px solid ${isTL ? "rgba(0,255,255,0.3)" : "rgba(255,191,0,0.25)"}`,
      }}
    >
      <div className="h-52 overflow-hidden">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 cursor-crosshair"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent pointer-events-none" />
      {/* Badge */}
      <div className="absolute top-2 left-2">
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
            isTL
              ? "text-cyan-300 bg-cyan-900/70 border border-cyan-500/50"
              : "text-amber-300 bg-amber-900/60 border border-amber-500/40"
          }`}
        >
          {badge}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-xs font-bold uppercase leading-snug">{name}</p>
      </div>
    </div>
  );
}

/** Engineer portrait card — 3-col grid */
function EngrCard({ name, img }: { name: string; img: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg group"
      style={{ border: "1px solid rgba(0,255,255,0.15)" }}
    >
      <div className="h-40 overflow-hidden">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 cursor-crosshair"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1.5 left-1.5">
        <span className="text-[8px] font-mono text-cyan-400/80 bg-black/60 border border-cyan-500/20 px-1.5 py-0.5 rounded">
          ENGR
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[10px] font-bold uppercase leading-tight">{name}</p>
      </div>
    </div>
  );
}

// ─── Team Column ─────────────────────────────────────────────────────────────

function TeamColumn({ team }: { team: (typeof TEAMS)[number] }) {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Team label */}
      <div
        className="text-[11px] font-mono text-cyan-400 uppercase tracking-[0.3em] px-5 py-2 rounded-sm mb-4"
        style={{
          background: "rgba(0,255,255,0.07)",
          border: "1px solid rgba(0,255,255,0.3)",
        }}
      >
        {team.label}
      </div>

      {/* Team Head */}
      <TeamHeadCard name={team.head.name} img={team.head.img} />

      <VLine h="h-8" />

      {/* TL */}
      <SectionLabel label="TL — Team Leads" />
      <div className="grid grid-cols-2 gap-2 w-full mb-6">
        {team.tls.map((p) => (
          <RoleCard key={p.name} name={p.name} badge="TL" img={p.img} />
        ))}
      </div>

      {/* ATL */}
      <SectionLabel label="ATL — Asst. Team Leads" />
      <div className="grid grid-cols-2 gap-2 w-full">
        {team.atls.map((p) => (
          <RoleCard key={p.name} name={p.name} badge="ATL" img={p.img} />
        ))}
      </div>

      <VLine h="h-8" />

      {/* Engineers */}
      <SectionLabel label="Engineers" />
      <div className="grid grid-cols-3 gap-2 w-full">
        {team.engineers.map((e) => (
          <EngrCard key={e.name} name={e.name} img={e.img} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function TeamSection() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 md:p-16 pb-16"
    >
      {/* Page title */}
      <h2
        className="font-display text-7xl uppercase tracking-tighter mb-16"
        style={{ textShadow: "0 0 10px var(--glow-color)", color: "var(--accent-color)" }}
      >
        THE TEAM
      </h2>

      {/* ── Org Chart ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">

        {/* ── Central Spine (vertical chain) ──────────────────────────────── */}
        {SPINE.map((person) => (
          <div key={person.name} className="flex flex-col items-center">
            <SpineCard {...person} />
            {/* Connector line below every node (last one feeds the T-branch) */}
            <VLine h="h-10" />
          </div>
        ))}

        {/* ── T-Branch + Team columns ───────────────────────────────────────
            max-w-5xl = 1024px → each team half = 512px
            left: 25% = 256px = center of Team 1 column  ✓
            right: 25% = 256px = center of Team 2 column ✓
            The VLine from Neil feeds into the exact midpoint (512px)  ✓
        ─────────────────────────────────────────────────────────────────── */}
        <div className="relative w-full max-w-5xl">
          {/* Horizontal bar: Team 1 center → Team 2 center */}
          <div
            className="absolute top-0 h-px bg-cyan-500/30"
            style={{ left: "25%", right: "25%" }}
          />
          {/* Vertical drops: T-bar → each Team Head label */}
          <div
            className="absolute h-10 w-px bg-cyan-500/30"
            style={{ top: 0, left: "25%", transform: "translateX(-50%)" }}
          />
          <div
            className="absolute h-10 w-px bg-cyan-500/30"
            style={{ top: 0, right: "25%", transform: "translateX(50%)" }}
          />

          {/* Two team columns */}
          <div className="grid grid-cols-2">
            {TEAMS.map((team) => (
              <div key={team.id} className="flex flex-col items-center pt-10 px-4">
                <TeamColumn team={team} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Contact Footer ────────────────────────────────────────────────── */}
      <div
        className="text-center p-8 mt-20"
        style={{
          border: "2px solid var(--border-color-strong)",
          background: "var(--bg-card)",
        }}
      >
        <p className="font-mono text-lg uppercase text-nasa-cyan">
          Contact: {TEAM_EMAIL}
        </p>
      </div>
    </motion.div>
  );
}
