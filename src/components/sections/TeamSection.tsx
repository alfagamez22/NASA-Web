"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TEAM_EMAIL } from "@/lib/constants";
import { useEditMode } from "@/lib/edit-mode-context";
import { usePendingChanges } from "@/lib/pending-context";
import { useHighlight } from "@/lib/highlight-context";
import ChangeHighlight from "@/components/ui/ChangeHighlight";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";

interface SpineMember { id: string; name: string; role: string; img: string; order: number }
interface DBTeamMember { id: string; teamId: string; name: string; img: string; role: string; order: number }
interface DBTeam { id: string; seqId: number; label: string; members: DBTeamMember[] }
interface TeamMemberData { name: string; img: string; dbId: string }
interface TeamData {
  dbId: string; seqId: number; label: string;
  head: TeamMemberData; tls: TeamMemberData[]; atls: TeamMemberData[]; engineers: TeamMemberData[];
}

function transformTeams(dbTeams: DBTeam[]): TeamData[] {
  return dbTeams.map((t) => {
    const grouped: Record<string, DBTeamMember[]> = { head: [], tl: [], atl: [], engineer: [] };
    for (const m of t.members) grouped[m.role]?.push(m);
    const toMember = (m: DBTeamMember): TeamMemberData => ({ name: m.name, img: m.img, dbId: m.id });
    return {
      dbId: t.id, seqId: t.seqId, label: t.label,
      head: grouped.head[0] ? toMember(grouped.head[0]) : { name: "(vacant)", img: "/placeholder.jpg", dbId: "" },
      tls: grouped.tl.map(toMember), atls: grouped.atl.map(toMember), engineers: grouped.engineer.map(toMember),
    };
  });
}

const SPINE_FIELDS: FormField[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Role / Title", required: true },
  { key: "img", label: "Photo", type: "image" },
];

const MEMBER_FIELDS: FormField[] = [
  { key: "name", label: "Name", required: true },
  { key: "img", label: "Photo", type: "image" },
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
      <div className="h-44 overflow-hidden">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 cursor-crosshair"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
      <div className="absolute top-1.5 left-1.5">
        <span className="text-[8px] font-mono text-cyan-400/80 bg-black/60 border border-cyan-500/20 px-1.5 py-0.5 rounded">
          ENGR
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white text-xs font-bold uppercase leading-tight">{name}</p>
      </div>
    </div>
  );
}

// ─── Team Column ─────────────────────────────────────────────────────────────

function TeamColumn({ team, isEditMode, onEditMember, onDeleteMember, onAddMember }: {
  team: TeamData;
  isEditMode?: boolean;
  onEditMember?: (teamId: string, role: string, idx: number, member: TeamMemberData) => void;
  onDeleteMember?: (teamId: string, role: string, idx: number) => void;
  onAddMember?: (teamId: string, role: string) => void;
}) {
  const editProps = (role: string, idx: number, m: TeamMemberData) => isEditMode ? {
    isEditMode, onEdit: () => onEditMember?.(team.dbId, role, idx, m), onDelete: () => onDeleteMember?.(team.dbId, role, idx),
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
        {...(isEditMode ? { isEditMode, onEdit: () => onEditMember?.(team.dbId, "head", 0, team.head), onDelete: () => onDeleteMember?.(team.dbId, "head", 0) } : {})}
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
        <button onClick={() => onAddMember?.(team.dbId, "tls")} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={12} /> Add TL</button>
      )}

      {/* ATL */}
      <SectionLabel label="ATL — Asst. Team Leads" />
      <div className="grid grid-cols-2 gap-2 w-full">
        {team.atls.map((p, i) => (
          <RoleCard key={p.name} name={p.name} badge="ATL" img={p.img} {...editProps("atls", i, p)} />
        ))}
      </div>
      {isEditMode && (
        <button onClick={() => onAddMember?.(team.dbId, "atls")} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={12} /> Add ATL</button>
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
        <button onClick={() => onAddMember?.(team.dbId, "engineers")} className="nasa-btn text-xs mt-4 flex items-center gap-1"><Plus size={12} /> Add Engineer</button>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function TeamSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending, getPendingAdds } = usePendingChanges();
  const [spine, setSpine] = useState<SpineMember[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);

  const fetchSpine = useCallback(async () => {
    try {
      const res = await fetch("/api/teams?type=spine");
      if (res.ok) setSpine(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) setTeams(transformTeams(await res.json()));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSpine(); fetchTeams(); }, [fetchSpine, fetchTeams]);

  const fetchAll = useCallback(() => { fetchSpine(); fetchTeams(); }, [fetchSpine, fetchTeams]);

  // ── Spine CRUD ─────────────────────────────────────────────────────────
  const [spineModal, setSpineModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);

  function handleAddSpine() { setSpineModal({ mode: "add" }); }
  function handleEditSpine(idx: number, m: SpineMember) { setSpineModal({ mode: "edit", idx, init: { name: m.name, role: m.role, img: m.img } }); }
  const { refresh: refreshHighlights } = useHighlight();

  async function handleDeleteSpine(idx: number) {
    const m = spine[idx];
    const applied = await notifyChange("team", "delete", m.name, `SpineMember:id:${m.id}`, {
      apiUrl: `/api/teams?id=${m.id}&type=spine`, apiMethod: "DELETE", previous: m,
    });
    if (applied) {
      await fetch(`/api/teams?id=${m.id}&type=spine`, { method: "DELETE" });
      markChanged();
      fetchAll();
      refreshHighlights();
    }
  }
  async function handleSpineSubmit(vals: Record<string, string>) {
    if (spineModal?.mode === "edit" && spineModal.idx != null) {
      const m = spine[spineModal.idx];
      const previous = { name: m.name, role: m.role, img: m.img };
      const apiBody = { type: "spine", id: m.id, name: vals.name, role: vals.role, img: vals.img };
      const applied = await notifyChange("team", "edit", vals.name, `SpineMember:id:${m.id}`, {
        apiUrl: "/api/teams", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "spine", name: vals.name, role: vals.role, img: vals.img, order: spine.length };
      const applied = await notifyChange("team", "add", vals.name, undefined, {
        apiUrl: "/api/teams", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    }
    setSpineModal(null);
  }

  // ── Team CRUD ──────────────────────────────────────────────────────────
  const [teamModal, setTeamModal] = useState<{ mode: "add" | "edit"; teamIdx?: number; init?: Record<string, string> } | null>(null);

  function handleAddTeam() { setTeamModal({ mode: "add" }); }
  function handleEditTeam(idx: number) { setTeamModal({ mode: "edit", teamIdx: idx, init: { label: teams[idx].label } }); }
  async function handleDeleteTeam(idx: number) {
    const t = teams[idx];
    const applied = await notifyChange("team", "delete", t.label, `Team:id:${t.dbId}`, {
      apiUrl: `/api/teams?id=${t.dbId}&type=team`, apiMethod: "DELETE", previous: t,
    });
    if (applied) {
      await fetch(`/api/teams?id=${t.dbId}&type=team`, { method: "DELETE" });
      markChanged();
      fetchAll();
      refreshHighlights();
    }
  }
  async function handleTeamSubmit(vals: Record<string, string>) {
    if (teamModal?.mode === "edit" && teamModal.teamIdx != null) {
      const t = teams[teamModal.teamIdx];
      const previous = { label: t.label };
      const apiBody = { id: t.dbId, label: vals.label };
      const applied = await notifyChange("team", "edit", vals.label, `Team:id:${t.dbId}`, {
        apiUrl: "/api/teams", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    } else {
      const apiBody = { seqId: Date.now(), label: vals.label };
      const applied = await notifyChange("team", "add", vals.label, undefined, {
        apiUrl: "/api/teams", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    }
    setTeamModal(null);
  }

  // ── Member CRUD ────────────────────────────────────────────────────────
  const roleMap: Record<string, string> = { head: "head", tls: "tl", atls: "atl", engineers: "engineer" };
  const [memberModal, setMemberModal] = useState<{ mode: "add" | "edit"; teamId: string; role: string; idx?: number; init?: Record<string, string> } | null>(null);

  function handleEditMember(teamId: string, role: string, idx: number, m: TeamMemberData) {
    setMemberModal({ mode: "edit", teamId, role, idx, init: { name: m.name, img: m.img } });
  }
  async function handleDeleteMember(teamId: string, role: string, idx: number) {
    const team = teams.find((t) => t.dbId === teamId);
    if (!team) return;
    const members = (team as unknown as Record<string, TeamMemberData[]>)[role] as TeamMemberData[] | undefined;
    const memberAtIdx = role === "head" ? team.head : members?.[idx];
    if (!memberAtIdx?.dbId) return;
    const applied = await notifyChange("team", "delete", memberAtIdx.name || "team member", `TeamMember:id:${memberAtIdx.dbId}`, {
      apiUrl: `/api/teams?id=${memberAtIdx.dbId}&type=member`, apiMethod: "DELETE", previous: memberAtIdx,
    });
    if (applied) {
      await fetch(`/api/teams?id=${memberAtIdx.dbId}&type=member`, { method: "DELETE" });
      markChanged();
      fetchAll();
      refreshHighlights();
    }
  }
  function handleAddMember(teamId: string, role: string) {
    setMemberModal({ mode: "add", teamId, role });
  }
  async function handleMemberSubmit(vals: Record<string, string>) {
    if (!memberModal) return;
    const { teamId, role, mode, idx } = memberModal;
    const dbRole = roleMap[role] || role;
    if (mode === "edit") {
      const team = teams.find((t) => t.dbId === teamId);
      if (!team) return;
      const members = role === "head" ? [team.head] : (team as unknown as Record<string, TeamMemberData[]>)[role];
      const memberAtIdx = role === "head" ? team.head : members?.[idx ?? 0];
      if (!memberAtIdx?.dbId) return;
      const previous = { name: memberAtIdx.name, img: memberAtIdx.img };
      const apiBody = { type: "member", id: memberAtIdx.dbId, name: vals.name, img: vals.img, role: dbRole };
      const applied = await notifyChange("team", "edit", vals.name, `TeamMember:id:${memberAtIdx.dbId}`, {
        apiUrl: "/api/teams", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "member", teamId, name: vals.name, img: vals.img, role: dbRole, order: 0 };
      const applied = await notifyChange("team", "add", vals.name, undefined, {
        apiUrl: "/api/teams", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchAll();
        refreshHighlights();
      }
    }
    setMemberModal(null);
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
        {spine.map((person, idx) => {
          const entityRef = `SpineMember:id:${person.id}`;
          const hasPending = isPending(entityRef);
          return (
          <ChangeHighlight key={person.name + idx} entityRef={entityRef}>
          <div className={`flex flex-col items-center ${hasPending ? "pending-change-highlight" : ""}`}>
            {hasPending && <span className="pending-change-badge">PENDING</span>}
            <SpineCard {...person}
              isEditMode={isEditMode}
              onEdit={() => handleEditSpine(idx, person)}
              onDelete={() => handleDeleteSpine(idx)}
            />
            <VLine h="h-10" />
          </div>
          </ChangeHighlight>
        );
        })}
        {isEditMode && (
          <button onClick={handleAddSpine} className="nasa-btn text-xs mb-4 flex items-center gap-1"><Plus size={14} /> Add Spine Member</button>
        )}
        {/* Pending add ghost cards for team page */}
        {getPendingAdds("team").map((p) => (
          <div key={p.id} className="relative pending-add-highlight nasa-card opacity-70 w-64" style={{ minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <span className="pending-add-badge">PENDING</span>
            <p className="font-mono text-sm text-green-400 uppercase tracking-wider">{p.itemName}</p>
            <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Awaiting approval</p>
          </div>
        ))}

        {/* ── T-Branch + Team columns ─────────────────────────────────────── */}
        <div className="relative w-full max-w-5xl">
          {/* Horizontal bar */}
          <div className="absolute top-0 h-px bg-cyan-500/30" style={{ left: "25%", right: "25%" }} />
          <div className="absolute h-10 w-px bg-cyan-500/30" style={{ top: 0, left: "25%", transform: "translateX(-50%)" }} />
          <div className="absolute h-10 w-px bg-cyan-500/30" style={{ top: 0, right: "25%", transform: "translateX(50%)" }} />

          {/* Two team columns */}
          <div className="grid grid-cols-2">
            {teams.map((team, tIdx) => (
              <ChangeHighlight key={team.dbId} entityRef={`Team:id:${team.dbId}`}>
              <div className="flex flex-col items-center pt-10 px-4">
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
              </ChangeHighlight>
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
