"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
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

export default function TeamDriveSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [drive, setDrive] = useState<TeamDriveCategory[]>([]);

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
      }
    }
    setItemModal(null);
  }

  const CategoryRow = ({ cat, catIdx }: { cat: TeamDriveCategory; catIdx: number }) => (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-8 relative z-10" style={{ borderColor: "var(--border-color)" }}>
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
  );

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
          <h1 className="font-display text-8xl md:text-9xl uppercase tracking-tighter text-nasa-light-cyan" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--accent-color)" }}>
            TEAM DRIVE
          </h1>
          <div className="mt-8 px-12 py-3 border-4 border-dashed" style={{ borderColor: "var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}>
            <p className="font-display text-xl md:text-2xl uppercase tracking-widest text-nasa-gray">
              *** THIS PAGE IS FOR NOC RAN USERS ONLY ***
            </p>
          </div>
        </div>

        {/* Dynamic Category Rows */}
        {drive.map((cat, catIdx) => (
          <CategoryRow key={cat.id} cat={cat} catIdx={catIdx} />
        ))}
        {isEditMode && (
          <button onClick={handleAddCategory} className="nasa-btn text-sm flex items-center gap-2 mx-auto"><Plus size={16} /> Add Category</button>
        )}

        {/* Embedded DRIVE Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full border-b-[2px] pb-16 relative z-10 pt-8" style={{ borderColor: "var(--border-color)" }}>
          <div className="w-full md:w-64 pt-4 shrink-0 text-center md:text-right pr-4">
            <h3 className="font-display text-4xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
              DRIVE:
            </h3>
          </div>
          <div className="flex-grow w-full max-w-3xl flex justify-center">
            <div className="w-full aspect-video overflow-hidden rounded-md flex items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
              <iframe
                src={DRIVE_IFRAME_URL}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay"
              />
              <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
            </div>
          </div>
        </div>

        {/* Embedded RAN Configuration PPM Section */}
        <div className="flex flex-col items-center justify-center w-full pt-16 relative z-10 space-y-12 pb-16">
          <h3 className="font-display text-4xl md:text-5xl uppercase tracking-widest text-nasa-light-cyan" style={{ textShadow: "0 0 10px var(--glow-color)" }}>
            RAN CONFIGURATION PPM
          </h3>
          <div className="w-full max-w-3xl aspect-video overflow-hidden rounded-md flex flex-col items-center justify-center border-4 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
            <iframe
              src={RAN_CONFIG_PPM_URL}
              className="w-full h-full border-0 absolute inset-0"
              allow="autoplay"
            />
            <span className="font-mono text-nasa-gray z-0">AWAITING VALID DRIVE URL</span>
          </div>
        </div>

        {/* Footer Area with QR placeholder */}
        <div className="w-full max-w-5xl mx-auto border-t-[2px] pt-16 flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 relative z-10 p-8 rounded-xl backdrop-blur-md" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-tertiary)" }}>
          <div className="text-left space-y-4">
            <p className="font-mono text-nasa-gray text-xs tracking-widest">NTG | OSCC | TAC | RAN</p>
            <p className="font-mono text-nasa-gray text-sm">We would love to hear your thoughts or feedback on how we can improve your experience with VORTEX. Just SCAN or CLICK the QR Code.</p>
            <p className="font-mono text-nasa-cyan font-bold">Have a nice day!</p>
          </div>
          <div className="shrink-0 w-32 h-32 flex items-center justify-center rounded-lg border-2 relative" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
            <span className="font-mono text-xs text-nasa-gray">QR Placeholder</span>
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
