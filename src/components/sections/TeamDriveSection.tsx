"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Link2 } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
import { usePendingChanges } from "@/lib/pending-context";
import { useHighlight } from "@/lib/highlight-context";
import ChangeHighlight from "@/components/ui/ChangeHighlight";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";

interface TeamDriveItem { id: string; categoryId: string; label: string; url: string; urlType: string; order: number }
interface TeamDriveCategory { id: string; title: string; order: number; items: TeamDriveItem[] }

const CATEGORY_FIELDS: FormField[] = [
  { key: "title", label: "Category Title", required: true, placeholder: "e.g. SCRIPTS" },
];

const ITEM_FIELDS: FormField[] = [
  { key: "label", label: "Label", required: true },
  { key: "url", label: "URL", type: "url", required: true },
  { key: "urlType", label: "URL Type", type: "select", options: [{ value: "url", label: "URL" }, { value: "gurl", label: "Google URL" }, { value: "yurl", label: "YouTube URL" }] },
];

const DRIVE_IFRAME_URL = "https://drive.google.com/...";
const RAN_CONFIG_PPM_URL = "https://drive.google.com/...";

interface TDSiteConfig {
  teamDriveHeading: string;
  teamDriveNotice: string;
  teamDriveNoticeVisible: boolean;
  driveLabel: string;
  driveUrl: string;
  ranConfigHeading: string;
  ranConfigUrl: string;
  tdBottomTeams: string;
  tdBottomFeedback: string;
  tdBottomSignoff: string;
  qrUrl: string;
}

const TD_DEFAULTS: TDSiteConfig = {
  teamDriveHeading: "TEAM DRIVE",
  teamDriveNotice: "*** THIS PAGE IS FOR NOC RAN USERS ONLY ***",
  teamDriveNoticeVisible: true,
  driveLabel: "DRIVE:",
  driveUrl: "",
  ranConfigHeading: "RAN CONFIGURATION PPM",
  ranConfigUrl: "",
  tdBottomTeams: "NTG | OSCC | TAC | RAN",
  tdBottomFeedback: "We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX. Just SCAN or CLICK the QR Code.",
  tdBottomSignoff: "Have a nice day!",
  qrUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf9O2wlqjlcv1uUAe-cHGNDpH6iEq7FOvNqeUl5lwP3tKdAhA/viewform",
};

export default function TeamDriveSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending, getPendingAdds } = usePendingChanges();
  const { refresh: refreshHighlights } = useHighlight();
  const [drive, setDrive] = useState<TeamDriveCategory[]>([]);

  // Editable site config fields
  const [cfg, setCfg] = useState<TDSiteConfig>(TD_DEFAULTS);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) {
          const data = await res.json();
          setCfg({
            teamDriveHeading: data.teamDriveHeading || TD_DEFAULTS.teamDriveHeading,
            teamDriveNotice: data.teamDriveNotice || TD_DEFAULTS.teamDriveNotice,
            teamDriveNoticeVisible: data.teamDriveNoticeVisible ?? TD_DEFAULTS.teamDriveNoticeVisible,
            driveLabel: data.driveLabel || TD_DEFAULTS.driveLabel,
            driveUrl: data.driveUrl || TD_DEFAULTS.driveUrl,
            ranConfigHeading: data.ranConfigHeading || TD_DEFAULTS.ranConfigHeading,
            ranConfigUrl: data.ranConfigUrl || TD_DEFAULTS.ranConfigUrl,
            tdBottomTeams: data.tdBottomTeams || TD_DEFAULTS.tdBottomTeams,
            tdBottomFeedback: data.tdBottomFeedback || TD_DEFAULTS.tdBottomFeedback,
            tdBottomSignoff: data.tdBottomSignoff || TD_DEFAULTS.tdBottomSignoff,
            qrUrl: data.qrUrl || TD_DEFAULTS.qrUrl,
          });
        }
      } catch { /* ignore */ }
    })();
  }, []);

  function startFieldEdit(field: string, value: string) { setEditingField(field); setFieldDraft(value); }
  async function saveFieldEdit(field: string) {
    const trimmed = fieldDraft.trim();
    if (trimmed) {
      setCfg((prev) => ({ ...prev, [field]: trimmed }));
      try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: trimmed }) }); } catch { /* ignore */ }
    }
    setEditingField(null);
  }
  async function toggleNoticeVisible() {
    const newVal = !cfg.teamDriveNoticeVisible;
    setCfg((prev) => ({ ...prev, teamDriveNoticeVisible: newVal }));
    try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamDriveNoticeVisible: newVal }) }); } catch { /* ignore */ }
  }

  const fetchDrive = useCallback(async () => {
    try {
      const res = await fetch("/api/drive");
      if (res.ok) setDrive(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchDrive(); }, [fetchDrive]);

  // ── Category CRUD ──────────────────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);

  function handleAddCategory() { setCatModal({ mode: "add" }); }
  function handleEditCategory(idx: number) { setCatModal({ mode: "edit", idx, init: { title: drive[idx].title } }); }
  async function handleDeleteCategory(idx: number) {
    const cat = drive[idx];
    const applied = await notifyChange("team-drive", "delete", cat.title, `TeamDriveCategory:id:${cat.id}`, {
      apiUrl: `/api/drive?id=${cat.id}&type=category`, apiMethod: "DELETE", previous: cat,
    });
    if (applied) {
      await fetch(`/api/drive?id=${cat.id}&type=category`, { method: "DELETE" });
      markChanged();
      fetchDrive();
      refreshHighlights();
    }
  }
  async function handleCatSubmit(vals: Record<string, string>) {
    if (catModal?.mode === "edit" && catModal.idx != null) {
      const cat = drive[catModal.idx];
      const previous = { title: cat.title };
      const apiBody = { type: "category", id: cat.id, title: vals.title };
      const applied = await notifyChange("team-drive", "edit", vals.title, `TeamDriveCategory:id:${cat.id}`, {
        apiUrl: "/api/drive", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/drive", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchDrive();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "category", title: vals.title, order: drive.length };
      const applied = await notifyChange("team-drive", "add", vals.title, undefined, {
        apiUrl: "/api/drive", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchDrive();
        refreshHighlights();
      }
    }
    setCatModal(null);
  }

  // ── Item CRUD ──────────────────────────────────────────────────────────
  const [itemModal, setItemModal] = useState<{ mode: "add" | "edit"; catIdx: number; itemIdx?: number; init?: Record<string, string> } | null>(null);

  function handleAddItem(catIdx: number) { setItemModal({ mode: "add", catIdx }); }
  function handleEditItem(catIdx: number, itemIdx: number, item: TeamDriveItem) {
    setItemModal({ mode: "edit", catIdx, itemIdx, init: { label: item.label, url: item.url, urlType: item.urlType } });
  }
  async function handleDeleteItem(catIdx: number, itemIdx: number) {
    const item = drive[catIdx].items[itemIdx];
    const applied = await notifyChange("team-drive", "delete", item.label, `TeamDriveItem:id:${item.id}`, {
      apiUrl: `/api/drive?id=${item.id}&type=item`, apiMethod: "DELETE", previous: item,
    });
    if (applied) {
      await fetch(`/api/drive?id=${item.id}&type=item`, { method: "DELETE" });
      markChanged();
      fetchDrive();
      refreshHighlights();
    }
  }
  async function handleItemSubmit(vals: Record<string, string>) {
    if (!itemModal) return;
    const cat = drive[itemModal.catIdx];
    if (itemModal.mode === "edit" && itemModal.itemIdx != null) {
      const item = cat.items[itemModal.itemIdx];
      const previous = { label: item.label, url: item.url, urlType: item.urlType };
      const apiBody = { type: "item", id: item.id, label: vals.label, url: vals.url, urlType: vals.urlType || "url" };
      const applied = await notifyChange("team-drive", "edit", vals.label, `TeamDriveItem:id:${item.id}`, {
        apiUrl: "/api/drive", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/drive", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchDrive();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "item", categoryId: cat.id, label: vals.label, url: vals.url, urlType: vals.urlType || "url", order: cat.items.length };
      const applied = await notifyChange("team-drive", "add", vals.label, undefined, {
        apiUrl: "/api/drive", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchDrive();
        refreshHighlights();
      }
    }
    setItemModal(null);
  }

  const CategoryRow = ({ cat, catIdx }: { cat: TeamDriveCategory; catIdx: number }) => {
    const entityRef = `TeamDriveCategory:id:${cat.id}`;
    const hasPending = isPending(entityRef);
    return (
    <ChangeHighlight entityRef={entityRef}>
    <div className={`flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-8 relative z-10 ${hasPending ? "pending-change-highlight" : ""}`} style={{ borderColor: "var(--border-color)" }}>
      {hasPending && <span className="pending-change-badge">PENDING</span>}
      <div className="w-full md:w-64 pt-4 shrink-0 text-center md:text-right pr-4">
        <h3 className="font-display text-4xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
          {cat.title}:
        </h3>
        {isEditMode && (
          <div className="flex gap-2 justify-center md:justify-end mt-2">
            <button onClick={() => handleEditCategory(catIdx)} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={12} /></button>
            <button onClick={() => handleDeleteCategory(catIdx)} className="p-1 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-grow w-full max-w-4xl">
        {cat.items.map((item, iIdx) => (
          <div key={item.id} className="group/item relative">
            <Link
              href={item.url || "#"}
              className="group relative flex items-center justify-center p-3 transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-nasa-blue/0 group-hover:bg-nasa-blue/20 transition-colors duration-300 rounded-lg" />
              <div className="nasa-card w-full text-center py-4 px-6 backdrop-blur-sm z-10">
                <span className="font-mono text-sm md:text-base font-bold text-nasa-gray group-hover:text-nasa-light-cyan uppercase transition-colors">{item.label}</span>
              </div>
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-nasa-cyan group-hover:border-nasa-light-cyan transition-colors z-20" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-nasa-cyan group-hover:border-nasa-light-cyan transition-colors z-20" />
            </Link>
            {isEditMode && (
              <div className="absolute top-1 right-1 z-30 hidden group-hover/item:flex gap-1">
                <button onClick={() => handleEditItem(catIdx, iIdx, item)} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={12} /></button>
                <button onClick={() => handleDeleteItem(catIdx, iIdx)} className="p-1 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={12} /></button>
              </div>
            )}
          </div>
        ))}
        {isEditMode && (
          <button onClick={() => handleAddItem(catIdx)} className="nasa-btn text-xs flex items-center justify-center gap-1 p-3"><Plus size={14} /> Add Item</button>
        )}
      </div>
    </div>
    </ChangeHighlight>
  );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen text-center py-16 overflow-hidden"
    >
      {/* Absolute Background image handling */}
      <div className="fixed inset-0 z-0 opacity-20 mix-blend-screen overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/server-rack.jpg')", filter: "contrast(1.2) brightness(0.8)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-16 px-4">

        {/* Hero Title Block */}
        <div className="flex flex-col items-center justify-center mb-16 space-y-4">
          <p className="font-mono text-sm uppercase text-nasa-gray tracking-[0.2em] mb-4">
             // SYSTEM_CONNECT / NODE: RAN
          </p>
          <div className="relative group/tdh">
            {editingField === "teamDriveHeading" ? (
              <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("teamDriveHeading"); }} className="flex items-center gap-2">
                <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-8xl md:text-9xl uppercase tracking-tighter bg-transparent outline-none text-center" style={{ color: "var(--accent-color)", borderBottom: "2px solid var(--accent-color)" }} autoFocus />
                <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={20} /></button>
                <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={20} /></button>
              </form>
            ) : (
              <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter text-nasa-light-cyan" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--accent-color)" }}>
                {cfg.teamDriveHeading}
              </h1>
            )}
            {isEditMode && editingField !== "teamDriveHeading" && (
              <button onClick={() => startFieldEdit("teamDriveHeading", cfg.teamDriveHeading)} className="absolute top-2 right-2 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/tdh:opacity-100 transition-opacity" title="Edit Heading"><Edit2 size={14} /></button>
            )}
          </div>

          {/* Notice banner - toggleable */}
          {(cfg.teamDriveNoticeVisible || isEditMode) && (
            <div className={`mt-8 px-12 py-3 border-4 border-dashed relative group/notice ${!cfg.teamDriveNoticeVisible ? "opacity-40" : ""}`} style={{ borderColor: "var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}>
              {editingField === "teamDriveNotice" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("teamDriveNotice"); }} className="flex items-center gap-2">
                  <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-xl md:text-2xl uppercase tracking-widest bg-transparent outline-none text-center" style={{ color: "var(--text-secondary)", borderBottom: "2px solid var(--accent-color)" }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={16} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={16} /></button>
                </form>
              ) : (
                <p className="font-display text-xl md:text-2xl uppercase tracking-widest text-nasa-gray">
                  {cfg.teamDriveNotice}
                </p>
              )}
              {isEditMode && editingField !== "teamDriveNotice" && (
                <div className="absolute top-1 right-1 z-50 flex gap-1 opacity-0 group-hover/notice:opacity-100 transition-opacity">
                  <button onClick={() => startFieldEdit("teamDriveNotice", cfg.teamDriveNotice)} className="p-1 bg-black/80 text-cyan-400 hover:text-white rounded" title="Edit Notice"><Edit2 size={12} /></button>
                  <button onClick={toggleNoticeVisible} className="p-1 bg-black/80 text-yellow-400 hover:text-yellow-300 rounded" title={cfg.teamDriveNoticeVisible ? "Hide Notice" : "Show Notice"}>
                    {cfg.teamDriveNoticeVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Category Rows */}
        {drive.map((cat, catIdx) => (
          <CategoryRow key={cat.id} cat={cat} catIdx={catIdx} />
        ))}
        {/* Pending add ghost cards */}
        {getPendingAdds("team-drive").map((p) => (
          <div key={p.id} className="relative pending-add-highlight nasa-card opacity-70 w-full" style={{ minHeight: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="pending-add-badge">PENDING</span>
            <p className="font-mono text-sm text-green-400 uppercase tracking-wider">{p.itemName}</p>
            <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Awaiting approval</p>
          </div>
        ))}
        {isEditMode && (
          <button onClick={handleAddCategory} className="nasa-btn text-sm flex items-center gap-2 mx-auto"><Plus size={16} /> Add Category</button>
        )}

        {/* Embedded DRIVE Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-16 relative z-10 pt-8" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-full md:w-64 pt-4 shrink-0 text-center md:text-right pr-4">
            <div className="relative group/dl inline-block">
              {editingField === "driveLabel" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("driveLabel"); }} className="flex items-center gap-2">
                  <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-4xl uppercase tracking-widest bg-transparent outline-none text-right" style={{ color: "var(--accent-color)", borderBottom: "2px solid var(--accent-color)", width: `${Math.max(fieldDraft.length, 4)}ch` }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={16} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={16} /></button>
                </form>
              ) : (
                <h3 className="font-display text-4xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
                  {cfg.driveLabel}
                </h3>
              )}
              {isEditMode && editingField !== "driveLabel" && (
                <button onClick={() => startFieldEdit("driveLabel", cfg.driveLabel)} className="absolute top-0 right-0 translate-x-6 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/dl:opacity-100 transition-opacity" title="Edit Label"><Edit2 size={12} /></button>
              )}
            </div>
            {/* Editable URL */}
            {isEditMode && (
              <div className="mt-2">
                {editingField === "driveUrl" ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("driveUrl"); }} className="flex items-center gap-1">
                    <input type="url" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} placeholder="Paste Drive URL..." className="font-mono text-[10px] bg-transparent outline-none w-full" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)" }} autoFocus />
                    <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={12} /></button>
                    <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={12} /></button>
                  </form>
                ) : (
                  <button onClick={() => startFieldEdit("driveUrl", cfg.driveUrl)} className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors mx-auto md:ml-auto md:mr-0" title="Edit Drive URL">
                    <Link2 size={10} /> {cfg.driveUrl ? "EDIT URL" : "SET URL"}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-grow w-full max-w-3xl flex justify-center">
            <div className="w-full aspect-video overflow-hidden rounded-md flex items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
              {cfg.driveUrl ? (
                <iframe src={cfg.driveUrl} className="w-full h-full border-0 absolute inset-0" allow="autoplay" />
              ) : (
                <>
                  <iframe src={DRIVE_IFRAME_URL} className="w-full h-full border-0 absolute inset-0" allow="autoplay" />
                  <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Embedded RAN Configuration PPM Section */}
        <div className="flex flex-col items-center justify-center w-full pt-16 relative z-10 space-y-12 pb-16">
          <div className="relative group/rch">
            {editingField === "ranConfigHeading" ? (
              <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("ranConfigHeading"); }} className="flex items-center gap-2">
                <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-4xl md:text-5xl uppercase tracking-widest bg-transparent outline-none text-center" style={{ color: "var(--accent-color)", borderBottom: "2px solid var(--accent-color)" }} autoFocus />
                <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={18} /></button>
                <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={18} /></button>
              </form>
            ) : (
              <h3 className="font-display text-4xl md:text-5xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
                {cfg.ranConfigHeading}
              </h3>
            )}
            {isEditMode && editingField !== "ranConfigHeading" && (
              <button onClick={() => startFieldEdit("ranConfigHeading", cfg.ranConfigHeading)} className="absolute top-0 right-0 translate-x-8 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/rch:opacity-100 transition-opacity" title="Edit Heading"><Edit2 size={14} /></button>
            )}
          </div>
          {/* Editable URL */}
          {isEditMode && (
            <div>
              {editingField === "ranConfigUrl" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("ranConfigUrl"); }} className="flex items-center gap-1">
                  <input type="url" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} placeholder="Paste RAN Config URL..." className="font-mono text-[10px] bg-transparent outline-none" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)", minWidth: "200px" }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={12} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={12} /></button>
                </form>
              ) : (
                <button onClick={() => startFieldEdit("ranConfigUrl", cfg.ranConfigUrl)} className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors" title="Edit RAN Config URL">
                  <Link2 size={10} /> {cfg.ranConfigUrl ? "EDIT URL" : "SET URL"}
                </button>
              )}
            </div>
          )}
          <div className="w-full max-w-3xl aspect-video overflow-hidden rounded-md flex flex-col items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
            {cfg.ranConfigUrl ? (
              <iframe src={cfg.ranConfigUrl} className="w-full h-full border-0 absolute inset-0" allow="autoplay" />
            ) : (
              <>
                <iframe src={RAN_CONFIG_PPM_URL} className="w-full h-full border-0 absolute inset-0" allow="autoplay" />
                <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
              </>
            )}
          </div>
        </div>

        {/* Footer Area with dynamic QR */}
        <div className="w-full max-w-5xl mx-auto border-t-[2px] pt-16 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 relative z-10 p-8 rounded-xl backdrop-blur-md" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
          <div className="text-left space-y-4">
            <div className="relative group/bteams inline-block">
              {editingField === "tdBottomTeams" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("tdBottomTeams"); }} className="flex items-center gap-1">
                  <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-mono text-xs bg-transparent outline-none tracking-widest" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--accent-color)", width: `${Math.max(fieldDraft.length, 10)}ch` }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={10} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={10} /></button>
                </form>
              ) : (
                <p className="font-mono text-nasa-gray text-xs tracking-widest">{cfg.tdBottomTeams}</p>
              )}
              {isEditMode && editingField !== "tdBottomTeams" && (
                <button onClick={() => startFieldEdit("tdBottomTeams", cfg.tdBottomTeams)} className="absolute top-0 -right-6 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/bteams:opacity-100 transition-opacity" title="Edit"><Edit2 size={8} /></button>
              )}
            </div>

            <div className="relative group/bfb">
              {editingField === "tdBottomFeedback" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("tdBottomFeedback"); }} className="flex items-start gap-1">
                  <textarea value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} rows={3} className="font-mono text-sm bg-transparent outline-none w-full resize-none" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--accent-color)" }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300 mt-1" title="Save"><Check size={10} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300 mt-1" title="Cancel"><X size={10} /></button>
                </form>
              ) : (
                <p className="font-mono text-nasa-gray text-sm">{cfg.tdBottomFeedback}</p>
              )}
              {isEditMode && editingField !== "tdBottomFeedback" && (
                <button onClick={() => startFieldEdit("tdBottomFeedback", cfg.tdBottomFeedback)} className="absolute top-0 -right-6 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/bfb:opacity-100 transition-opacity" title="Edit"><Edit2 size={8} /></button>
              )}
            </div>

            <div className="relative group/bso">
              {editingField === "tdBottomSignoff" ? (
                <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("tdBottomSignoff"); }} className="flex items-center gap-1">
                  <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-mono bg-transparent outline-none font-bold" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)", width: `${Math.max(fieldDraft.length, 8)}ch` }} autoFocus />
                  <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={10} /></button>
                  <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={10} /></button>
                </form>
              ) : (
                <p className="font-mono text-nasa-cyan font-bold">{cfg.tdBottomSignoff}</p>
              )}
              {isEditMode && editingField !== "tdBottomSignoff" && (
                <button onClick={() => startFieldEdit("tdBottomSignoff", cfg.tdBottomSignoff)} className="absolute top-0 -right-6 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/bso:opacity-100 transition-opacity" title="Edit"><Edit2 size={8} /></button>
              )}
            </div>
          </div>

          {/* Dynamic QR Code */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            {cfg.qrUrl ? (
              <a href={cfg.qrUrl} target="_blank" rel="noopener noreferrer" className="w-32 h-32 flex items-center justify-center rounded-lg border-2 relative overflow-hidden" style={{ borderColor: "var(--border-color)", backgroundColor: "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(cfg.qrUrl)}`}
                  alt="Scan QR Code"
                  className="w-full h-full object-contain"
                />
              </a>
            ) : (
              <div className="w-32 h-32 flex items-center justify-center rounded-lg border-2 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                <span className="font-mono text-xs text-nasa-gray">QR Placeholder</span>
              </div>
            )}
            {isEditMode && (
              <div>
                {editingField === "qrUrl" ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("qrUrl"); }} className="flex items-center gap-1">
                    <input type="url" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} placeholder="QR Link URL..." className="font-mono text-[10px] bg-transparent outline-none" style={{ color: "var(--accent-color)", borderBottom: "1px solid var(--accent-color)", width: "160px" }} autoFocus />
                    <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={10} /></button>
                    <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={10} /></button>
                  </form>
                ) : (
                  <button onClick={() => startFieldEdit("qrUrl", cfg.qrUrl)} className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors" title="Edit QR Link">
                    <Link2 size={10} /> EDIT QR LINK
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ItemFormModal isOpen={!!catModal} onClose={() => setCatModal(null)}
        title={catModal?.mode === "edit" ? "Edit Category" : "Add Category"}
        fields={CATEGORY_FIELDS} initialValues={catModal?.init ?? {}} onSubmit={handleCatSubmit}
      />
      <ItemFormModal isOpen={!!itemModal} onClose={() => setItemModal(null)}
        title={itemModal?.mode === "edit" ? "Edit Item" : "Add Item"}
        fields={ITEM_FIELDS} initialValues={itemModal?.init ?? {}} onSubmit={handleItemSubmit}
      />
    </motion.div>
  );
}
