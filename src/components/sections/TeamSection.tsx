"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TEAM_EMAIL } from "@/lib/constants";
import { getTeamSpine, saveTeamSpine, getTeams, saveTeams, type SpineMember, type TeamData, type TeamMemberData } from "@/lib/data-store";
import { useEditMode } from "@/lib/edit-mode-context";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";

const SPINE_FIELDS: FormField[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role / Title", required: true },
  { key: "img", label: "Image URL", required: true, placeholder: "https://picsum.photos/seed/name/400/500" },
];

const MEMBER_FIELDS: FormField[] = [
  { key: "name", label: "Name", required: true },
  { key: "img", label: "Image URL", required: true, placeholder: "https://picsum.photos/seed/name/400/500" },
];

const TEAM_FIELDS: FormField[] = [
  { key: "label", label: "Team Name", required: true, placeholder: "e.g. NASA Team 3" },
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

// ─── Edit overlay helper ─────────────────────────────────────────────────────

function EditOverlay({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="absolute top-2 right-2 z-10 hidden group-hover:flex gap-1">
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500 transition"><Edit2 size={12} /></button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 bg-red-600/80 rounded hover:bg-red-500 transition"><Trash2 size={12} /></button>
    </div>
  );
}

// ─── Card components ─────────────────────────────────────────────────────────

/** Top-of-spine portrait card — large */
function SpineCard({ name, role, img, isEditMode, onEdit, onDelete }: { name: string; role: string; img: string; isEditMode?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl w-64 flex-shrink-0 group"
      style={{ border: "1px solid rgba(0,255,255,0.25)" }}
    >
      {isEditMode && onEdit && onDelete && <EditOverlay onEdit={onEdit} onDelete={onDelete} />}
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
function TeamHeadCard({ name, img, isEditMode, onEdit, onDelete }: { name: string; img: string; isEditMode?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl w-full group"
      style={{
        border: "2px solid rgba(0,255,255,0.45)",
        boxShadow: "0 0 28px rgba(0,255,255,0.1)",
      }}
    >
      {isEditMode && onEdit && onDelete && <EditOverlay onEdit={onEdit} onDelete={onDelete} />}
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
function RoleCard({ name, badge, img, isEditMode, onEdit, onDelete }: { name: string; badge: "TL" | "ATL"; img: string; isEditMode?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const isTL = badge === "TL";
  return (
    <div
      className="relative overflow-hidden rounded-lg group"
      style={{
        border: `1px solid ${isTL ? "rgba(0,255,255,0.3)" : "rgba(255,191,0,0.25)"}`,
      }}
    >
      {isEditMode && onEdit && onDelete && <EditOverlay onEdit={onEdit} onDelete={onDelete} />}
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
function EngrCard({ name, img, isEditMode, onEdit, onDelete }: { name: string; img: string; isEditMode?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg group"
      style={{ border: "1px solid rgba(0,255,255,0.15)" }}
    >
      {isEditMode && onEdit && onDelete && <EditOverlay onEdit={onEdit} onDelete={onDelete} />}
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

function TeamColumn({ team, isEditMode, onEditMember, onDeleteMember, onAddMember }: {
  team: TeamData;
  isEditMode?: boolean;
  onEditMember?: (teamId: number, role: string, idx: number, member: TeamMemberData) => void;
  onDeleteMember?: (teamId: number, role: string, idx: number) => void;
  onAddMember?: (teamId: number, role: string) => void;
}) {
  const editProps = (role: string, idx: number, m: TeamMemberData) => isEditMode ? {
    isEditMode, onEdit: () => onEditMember?.(team.id, role, idx, m), onDelete: () => onDeleteMember?.(team.id, role, idx),
  } : {};

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
      <TeamHeadCard name={team.head.name} img={team.head.img}
        {...(isEditMode ? { isEditMode, onEdit: () => onEditMember?.(team.id, "head", 0, team.head), onDelete: () => onDeleteMember?.(team.id, "head", 0) } : {})}
      />

      <VLine h="h-8" />

      {/* TL */}
      <SectionLabel label="TL — Team Leads" />
      <div className="grid grid-cols-2 gap-2 w-full mb-6">
        {team.tls.map((p, i) => (
          <RoleCard key={p.name} name={p.name} badge="TL" img={p.img} {...editProps("tls", i, p)} />
        ))}
      </div>
      {isEditMode && (
        <button onClick={() => onAddMember?.(team.id, "tls")} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={12} /> Add TL</button>
      )}

      {/* ATL */}
      <SectionLabel label="ATL — Asst. Team Leads" />
      <div className="grid grid-cols-2 gap-2 w-full">
        {team.atls.map((p, i) => (
          <RoleCard key={p.name} name={p.name} badge="ATL" img={p.img} {...editProps("atls", i, p)} />
        ))}
      </div>
      {isEditMode && (
        <button onClick={() => onAddMember?.(team.id, "atls")} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={12} /> Add ATL</button>
      )}

      <VLine h="h-8" />

      {/* Engineers */}
      <SectionLabel label="Engineers" />
      <div className="grid grid-cols-3 gap-2 w-full">
        {team.engineers.map((e, i) => (
          <EngrCard key={e.name} name={e.name} img={e.img} {...editProps("engineers", i, e)} />
        ))}
      </div>
      {isEditMode && (
        <button onClick={() => onAddMember?.(team.id, "engineers")} className="nasa-btn text-xs mt-4 flex items-center gap-1"><Plus size={12} /> Add Engineer</button>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function TeamSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const spine = getTeamSpine();
  const teams = getTeams();
  void refreshKey;

  // ── Spine CRUD ─────────────────────────────────────────────────────────
  const [spineModal, setSpineModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);

  function handleAddSpine() { setSpineModal({ mode: "add" }); }
  function handleEditSpine(idx: number, m: SpineMember) { setSpineModal({ mode: "edit", idx, init: { name: m.name, role: m.role, img: m.img } }); }
  function handleDeleteSpine(idx: number) {
    const s = [...spine]; s.splice(idx, 1); saveTeamSpine(s);
    markChanged(); notifyChange("team", "delete", "spine member"); refresh();
  }
  function handleSpineSubmit(vals: Record<string, string>) {
    const s = [...spine];
    const member: SpineMember = { name: vals.name, role: vals.role, img: vals.img };
    if (spineModal?.mode === "edit" && spineModal.idx != null) { s[spineModal.idx] = member; } else { s.push(member); }
    saveTeamSpine(s); markChanged(); notifyChange("team", spineModal?.mode === "edit" ? "edit" : "add", vals.name); setSpineModal(null); refresh();
  }

  // ── Team CRUD ──────────────────────────────────────────────────────────
  const [teamModal, setTeamModal] = useState<{ mode: "add" | "edit"; teamIdx?: number; init?: Record<string, string> } | null>(null);

  function handleAddTeam() { setTeamModal({ mode: "add" }); }
  function handleEditTeam(idx: number) { setTeamModal({ mode: "edit", teamIdx: idx, init: { label: teams[idx].label } }); }
  function handleDeleteTeam(idx: number) {
    const t = [...teams]; t.splice(idx, 1); saveTeams(t);
    markChanged(); notifyChange("team", "delete", "team"); refresh();
  }
  function handleTeamSubmit(vals: Record<string, string>) {
    const t = [...teams];
    if (teamModal?.mode === "edit" && teamModal.teamIdx != null) {
      t[teamModal.teamIdx] = { ...t[teamModal.teamIdx], label: vals.label };
    } else {
      t.push({ id: Date.now(), label: vals.label, head: { name: "New Head", img: "https://picsum.photos/seed/new/400/500" }, tls: [], atls: [], engineers: [] });
    }
    saveTeams(t); markChanged(); notifyChange("team", teamModal?.mode === "edit" ? "edit" : "add", vals.label); setTeamModal(null); refresh();
  }

  // ── Member CRUD ────────────────────────────────────────────────────────
  const [memberModal, setMemberModal] = useState<{ mode: "add" | "edit"; teamId: number; role: string; idx?: number; init?: Record<string, string> } | null>(null);

  function handleEditMember(teamId: number, role: string, idx: number, m: TeamMemberData) {
    setMemberModal({ mode: "edit", teamId, role, idx, init: { name: m.name, img: m.img } });
  }
  function handleDeleteMember(teamId: number, role: string, idx: number) {
    const t = teams.map((tm) => {
      if (tm.id !== teamId) return tm;
      if (role === "head") { return { ...tm, head: { name: "(vacant)", img: "https://picsum.photos/seed/vacant/400/500" } }; }
      const arr = [...(tm as unknown as Record<string, unknown>)[role] as TeamMemberData[]];
      arr.splice(idx, 1);
      return { ...tm, [role]: arr } as TeamData;
    });
    saveTeams(t); markChanged(); notifyChange("team", "delete", "team member"); refresh();
  }
  function handleAddMember(teamId: number, role: string) {
    setMemberModal({ mode: "add", teamId, role });
  }
  function handleMemberSubmit(vals: Record<string, string>) {
    if (!memberModal) return;
    const { teamId, role, mode, idx } = memberModal;
    const member: TeamMemberData = { name: vals.name, img: vals.img };
    const t = teams.map((tm) => {
      if (tm.id !== teamId) return tm;
      if (role === "head") { return { ...tm, head: member }; }
      const arr = [...(tm as unknown as Record<string, unknown>)[role] as TeamMemberData[]];
      if (mode === "edit" && idx != null) { arr[idx] = member; } else { arr.push(member); }
      return { ...tm, [role]: arr } as TeamData;
    });
    saveTeams(t); markChanged(); notifyChange("team", mode === "edit" ? "edit" : "add", vals.name); setMemberModal(null); refresh();
  }

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
        {spine.map((person, idx) => (
          <div key={person.name + idx} className="flex flex-col items-center">
            <SpineCard {...person}
              isEditMode={isEditMode}
              onEdit={() => handleEditSpine(idx, person)}
              onDelete={() => handleDeleteSpine(idx)}
            />
            <VLine h="h-10" />
          </div>
        ))}
        {isEditMode && (
          <button onClick={handleAddSpine} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={14} /> Add Spine Member</button>
        )}

        {/* ── T-Branch + Team columns ─────────────────────────────────────── */}
        <div className="relative w-full max-w-5xl">
          {/* Horizontal bar */}
          <div className="absolute top-0 h-px bg-cyan-500/30" style={{ left: "25%", right: "25%" }} />
          <div className="absolute h-10 w-px bg-cyan-500/30" style={{ top: 0, left: "25%", transform: "translateX(-50%)" }} />
          <div className="absolute h-10 w-px bg-cyan-500/30" style={{ top: 0, right: "25%", transform: "translateX(50%)" }} />

          {/* Two team columns */}
          <div className="grid grid-cols-2">
            {teams.map((team, tIdx) => (
              <div key={team.id} className="flex flex-col items-center pt-10 px-4">
                {isEditMode && (
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => handleEditTeam(tIdx)} className="nasa-btn text-xs flex items-center gap-1"><Edit2 size={12} /> Rename</button>
                    <button onClick={() => handleDeleteTeam(tIdx)} className="p-1.5 bg-red-600/60 rounded hover:bg-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                  </div>
                )}
                <TeamColumn team={team} isEditMode={isEditMode}
                  onEditMember={handleEditMember} onDeleteMember={handleDeleteMember} onAddMember={handleAddMember}
                />
              </div>
            ))}
          </div>
        </div>

        {isEditMode && (
          <button onClick={handleAddTeam} className="nasa-btn text-sm mt-8 flex items-center gap-2"><Plus size={16} /> Add Team</button>
        )}
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

      {/* Modals */}
      <ItemFormModal isOpen={!!spineModal} onClose={() => setSpineModal(null)}
        title={spineModal?.mode === "edit" ? "Edit Spine Member" : "Add Spine Member"}
        fields={SPINE_FIELDS} initialValues={spineModal?.init ?? {}} onSubmit={handleSpineSubmit}
      />
      <ItemFormModal isOpen={!!teamModal} onClose={() => setTeamModal(null)}
        title={teamModal?.mode === "edit" ? "Rename Team" : "Add Team"}
        fields={TEAM_FIELDS} initialValues={teamModal?.init ?? {}} onSubmit={handleTeamSubmit}
      />
      <ItemFormModal isOpen={!!memberModal} onClose={() => setMemberModal(null)}
        title={memberModal?.mode === "edit" ? "Edit Member" : "Add Member"}
        fields={MEMBER_FIELDS} initialValues={memberModal?.init ?? {}} onSubmit={handleMemberSubmit}
      />
    </motion.div>
  );
}
