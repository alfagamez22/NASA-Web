"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
import { usePendingChanges } from "@/lib/pending-context";
import { useHighlight } from "@/lib/highlight-context";
import ChangeHighlight from "@/components/ui/ChangeHighlight";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";

interface DBVortexItem { id: string; categoryId: string; content: string; order: number }
interface DBVortexCategory { id: string; title: string; order: number; items: DBVortexItem[] }
interface DBVortexCredit { id: string; name: string; role: string; order: number }
interface UICategory { id: string; title: string; items: string[]; dbItems: DBVortexItem[] }
interface UICredit { id: string; name: string; role: string }
interface VortexData { categories: UICategory[]; credits: UICredit[] }

const CAT_FIELDS: FormField[] = [
  { key: "title", label: "Category Title", required: true },
];
const ITEM_FIELDS: FormField[] = [
  { key: "item", label: "Item Text", required: true },
];
const CREDIT_FIELDS: FormField[] = [
  { key: "name", label: "Name / Title", required: true },
  { key: "role", label: "Role / Description", required: true },
];

const HEADER_OFFSET = 72;
const STEP_HEIGHT_VH = 100; // Total scroll distance per layer
const TOTAL_LAYERS = 3; // Layer 0: Hero, Layer 1: Directory, Layer 2: Credits

function clampIndex(value: number, max: number) {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

export default function InsideVortexSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending } = usePendingChanges();
  const { refresh: refreshHighlights } = useHighlight();
  const [data, setData] = useState<VortexData>({ categories: [], credits: [] });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/vortex");
      if (!res.ok) return;
      const json = await res.json();
      const categories: UICategory[] = (json.categories ?? []).map((c: DBVortexCategory) => ({
        id: c.id,
        title: c.title,
        items: c.items.map((i: DBVortexItem) => i.content),
        dbItems: c.items,
      }));
      const credits: UICredit[] = (json.credits ?? []).map((c: DBVortexCredit) => ({
        id: c.id,
        name: c.name,
        role: c.role,
      }));
      setData({ categories, credits });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Category CRUD ──────────────────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);
  function handleAddCat() { setCatModal({ mode: "add" }); }
  function handleEditCat(idx: number) { setCatModal({ mode: "edit", idx, init: { title: data.categories[idx].title } }); }
  async function handleDeleteCat(idx: number) {
    const cat = data.categories[idx];
    const applied = await notifyChange("inside-vortex", "delete", cat.title, `VortexCategory:id:${cat.id}`, {
      apiUrl: `/api/vortex?id=${cat.id}&type=category`, apiMethod: "DELETE", previous: cat,
    });
    if (applied) {
      await fetch(`/api/vortex?id=${cat.id}&type=category`, { method: "DELETE" });
      markChanged();
      fetchData();
      refreshHighlights();
    }
  }
  async function handleCatSubmit(vals: Record<string, string>) {
    if (catModal?.mode === "edit" && catModal.idx != null) {
      const cat = data.categories[catModal.idx];
      const previous = { title: cat.title };
      const apiBody = { type: "category", id: cat.id, title: vals.title };
      const applied = await notifyChange("inside-vortex", "edit", vals.title, `VortexCategory:id:${cat.id}`, {
        apiUrl: "/api/vortex", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "category", title: vals.title, order: data.categories.length };
      const applied = await notifyChange("inside-vortex", "add", vals.title, undefined, {
        apiUrl: "/api/vortex", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    }
    setCatModal(null);
  }

  // ── Item CRUD (within categories) ──────────────────────────────────────
  const [itemModal, setItemModal] = useState<{ mode: "add" | "edit"; catIdx: number; itemIdx?: number; init?: Record<string, string> } | null>(null);
  function handleAddItem(catIdx: number) { setItemModal({ mode: "add", catIdx }); }
  function handleEditItem(catIdx: number, itemIdx: number) { setItemModal({ mode: "edit", catIdx, itemIdx, init: { item: data.categories[catIdx].items[itemIdx] } }); }
  async function handleDeleteItem(catIdx: number, itemIdx: number) {
    const dbItem = data.categories[catIdx].dbItems[itemIdx];
    const applied = await notifyChange("inside-vortex", "delete", dbItem.content || "vortex item", `VortexItem:id:${dbItem.id}`, {
      apiUrl: `/api/vortex?id=${dbItem.id}&type=item`, apiMethod: "DELETE", previous: dbItem,
    });
    if (applied) {
      await fetch(`/api/vortex?id=${dbItem.id}&type=item`, { method: "DELETE" });
      markChanged();
      fetchData();
      refreshHighlights();
    }
  }
  async function handleItemSubmit(vals: Record<string, string>) {
    if (!itemModal) return;
    const cat = data.categories[itemModal.catIdx];
    if (itemModal.mode === "edit" && itemModal.itemIdx != null) {
      const dbItem = cat.dbItems[itemModal.itemIdx];
      const previous = { content: dbItem.content };
      const apiBody = { type: "item", id: dbItem.id, content: vals.item };
      const applied = await notifyChange("inside-vortex", "edit", vals.item, `VortexItem:id:${dbItem.id}`, {
        apiUrl: "/api/vortex", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "item", categoryId: cat.id, content: vals.item, order: cat.items.length };
      const applied = await notifyChange("inside-vortex", "add", vals.item, undefined, {
        apiUrl: "/api/vortex", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    }
    setItemModal(null);
  }

  // ── Credit CRUD ────────────────────────────────────────────────────────
  const [creditModal, setCreditModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);
  function handleAddCredit() { setCreditModal({ mode: "add" }); }
  function handleEditCredit(idx: number) { setCreditModal({ mode: "edit", idx, init: { name: data.credits[idx].name, role: data.credits[idx].role } }); }
  async function handleDeleteCredit(idx: number) {
    const credit = data.credits[idx];
    const applied = await notifyChange("inside-vortex", "delete", credit.name, `VortexCredit:id:${credit.id}`, {
      apiUrl: `/api/vortex?id=${credit.id}&type=credit`, apiMethod: "DELETE", previous: credit,
    });
    if (applied) {
      await fetch(`/api/vortex?id=${credit.id}&type=credit`, { method: "DELETE" });
      markChanged();
      fetchData();
      refreshHighlights();
    }
  }
  async function handleCreditSubmit(vals: Record<string, string>) {
    if (creditModal?.mode === "edit" && creditModal.idx != null) {
      const credit = data.credits[creditModal.idx];
      const previous = { name: credit.name, role: credit.role };
      const apiBody = { type: "credit", id: credit.id, name: vals.name, role: vals.role };
      const applied = await notifyChange("inside-vortex", "edit", vals.name, `VortexCredit:id:${credit.id}`, {
        apiUrl: "/api/vortex", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    } else {
      const apiBody = { type: "credit", name: vals.name, role: vals.role, order: data.credits.length };
      const applied = await notifyChange("inside-vortex", "add", vals.name, undefined, {
        apiUrl: "/api/vortex", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/vortex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchData();
        refreshHighlights();
      }
    }
    setCreditModal(null);
  }

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Background Transitions based directly on the container scroll progress
  // At progress 0 (top), Laserflow is visible.
  // At progress > 0.3, Milkyway fades in.
  const entryBlend = useSpring(
    useTransform(sectionProgress, [0, 0.4], [0, 1]),
    { stiffness: 120, damping: 28 }
  );

  const laserflowOpacity = useSpring(
    useTransform(entryBlend, [0, 1], [1, 0]),
    { stiffness: 120, damping: 28 }
  );
  const milkywayOpacity = useSpring(entryBlend, {
    stiffness: 120,
    damping: 28,
  });

  useMotionValueEvent(sectionProgress, "change", (latest) => {
    // Snap layer 0, 1, or 2 based on scroll progress threshold
    const nextIndex = clampIndex(
      Math.round(latest * (TOTAL_LAYERS - 1)),
      TOTAL_LAYERS - 1
    );
    setActiveIndex(nextIndex);
  });

  return (
    <div className="relative isolate w-full">
      {/* Hide the global window scrollbar strictly on this cinematic page to prevent it from slicing through the Header/Footer */}
      <style dangerouslySetInnerHTML={{
        __html: `
        body::-webkit-scrollbar { display: none !important; }
        body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}} />

      {/* 
        We render the scroll container with exactly enough height to trigger the 3 states.
        300vh means scrolling down 2 screen heights transitions us through Directory to Credits.
      */}
      <section
        ref={sectionRef}
        className="relative"
        style={{ minHeight: `${TOTAL_LAYERS * STEP_HEIGHT_VH}vh` }}
      >
        {/* Sticky viewport that stays on screen while scrolling through the extra height */}
        <div
          className="sticky w-full overflow-hidden"
          style={{
            top: `${HEADER_OFFSET}px`,
            height: `calc(100vh - ${HEADER_OFFSET}px)`,
          }}
        >
          {/* Dynamic Backgrounds */}
          <motion.div
            className="absolute inset-0 z-0 bg-nasa-darker"
            style={{ opacity: laserflowOpacity }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-[50%_100%]"
            >
              <source src="/laserflow.webm" type="video/webm" />
            </video>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(1, 5, 12, 0.48) 0%, rgba(1, 5, 12, 0.78) 100%)",
              }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 z-0 bg-nasa-darker"
            style={{ opacity: milkywayOpacity }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-center"
            >
              <source src="/MILKYWAY.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at top, rgba(18, 64, 96, 0.16) 0%, rgba(0, 0, 0, 0) 42%), linear-gradient(180deg, rgba(2, 5, 12, 0.4) 0%, rgba(2, 5, 12, 0.75) 100%)",
              }}
            />
          </motion.div>

          {/* Interactive Content Layers */}
          <div className="absolute inset-0 z-10">
            <AnimatePresence initial={false} mode="wait">
              {activeIndex === 0 && (
                /* HERO LAYER */
                <motion.div
                  key="hero-layer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col items-center justify-center px-6 md:px-10"
                >
                  <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
                    <p
                      className="font-mono text-xs uppercase tracking-[0.45em] text-nasa-gray md:text-sm"
                      style={{ color: "var(--accent-color)" }}
                    >
                      // ENTER THE VORTEX DEPTH MAP
                    </p>
                    <h1
                      className="font-display text-5xl uppercase tracking-tight md:text-7xl lg:text-8xl"
                      style={{
                        color: "var(--text-primary)",
                        textShadow: "0 0 20px rgba(0,212,255,0.2)",
                      }}
                    >
                      WHAT&apos;S INSIDE THE{" "}
                      <span
                        style={{
                          color: "var(--accent-color)",
                          textShadow: "0 0 24px var(--glow-color)",
                        }}
                      >
                        VORTEX
                      </span>
                    </h1>
                    <div className="nasa-card max-w-3xl text-center">
                      <p
                        className="font-mono text-sm uppercase leading-relaxed md:text-base tracking-[0.1em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Scroll down to enter the core modules, operational
                        references, and structural depths of the portal.
                      </p>
                    </div>
                    {/* Scroll Indicator */}
                    <div
                      className="mt-6 flex flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: "var(--accent-light)" }}
                    >
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-12 w-6 justify-center rounded-full border-2 p-1.5"
                        style={{
                          borderColor: "var(--border-color-strong)",
                          background: "rgba(5, 10, 21, 0.6)",
                        }}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full bg-[var(--accent-color)]"
                          style={{ boxShadow: "0 0 8px var(--glow-color)" }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeIndex === 1 && (
                /* DIRECTORY LAYER */
                <motion.div
                  key="directory-layer"
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -40 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col justify-center px-6 md:px-10 overflow-y-auto py-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  <div className="mx-auto max-w-7xl flex flex-col gap-10 w-full pt-8 md:pt-0">
                    {/* Directory Header Title */}
                    <div className="text-center space-y-4 shrink-0">
                      <h2
                        className="font-display text-4xl uppercase tracking-tight md:text-5xl"
                        style={{ color: "var(--text-primary)" }}
                      >
                        VORTEX{" "}
                        <span
                          style={{
                            color: "var(--accent-light)",
                            textShadow: "0 0 18px var(--glow-color)",
                          }}
                        >
                          DIRECTORY
                        </span>
                      </h2>
                      <div className="w-24 h-[2px] bg-[var(--accent-color)] mx-auto rounded-full shadow-[0_0_12px_var(--glow-color)]" />
                    </div>

                    {/* Subpage Grid of Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full pb-8">
                      {data.categories.map((category, idx) => {
                        const catHasPending = isPending(`VortexCategory:id:${category.id}`);
                        return (
                        <ChangeHighlight key={category.title + idx} entityRef={`VortexCategory:id:${category.id}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                          className={`nasa-card flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 group/card relative ${catHasPending ? "pending-change-highlight" : ""}`}
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(5, 10, 21, 0.75) 0%, rgba(2, 5, 12, 0.95) 100%)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid var(--border-color-strong)",
                          }}
                        >
                          {isEditMode && (
                            <div className="absolute top-2 right-2 z-10 hidden group-hover/card:flex gap-1">
                              <button onClick={() => handleEditCat(idx)} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteCat(idx)} className="p-1 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={12} /></button>
                            </div>
                          )}
                          {/* Card Title Header */}
                          <div className="border-b-[1px] border-[var(--border-color)] pb-3 mb-5">
                            <p
                              className="font-mono text-[10px] uppercase tracking-[0.3em] mb-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              // Subsystem Layer
                            </p>
                            <h3
                              className="font-display text-2xl uppercase tracking-tighter"
                              style={{
                                color: "var(--accent-color)",
                                textShadow: "0 0 12px rgba(0,212,255,0.15)",
                              }}
                            >
                              {category.title}
                            </h3>
                          </div>

                          {/* Information List Items */}
                          <ul className="flex flex-col gap-4 flex-grow">
                            {category.items.map((item, iIdx) => {
                              const itemHasPending = isPending(`VortexItem:id:${category.dbItems[iIdx]?.id}`);
                              return (
                              <li key={item + iIdx} className={`flex items-start gap-4 group/item ${itemHasPending ? "pending-change-highlight" : ""}`}>
                                <span
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-[var(--accent-light)] transition-all duration-300 group-hover:bg-[var(--accent-color)]"
                                  style={{ boxShadow: "0 0 8px var(--glow-color)" }}
                                />
                                <span
                                  className="font-mono text-sm uppercase leading-relaxed text-left flex-1"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {item}
                                </span>
                                {isEditMode && (
                                  <span className="hidden group-hover/item:flex gap-1 shrink-0">
                                    <button onClick={() => handleEditItem(idx, iIdx)} className="p-0.5 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={10} /></button>
                                    <button onClick={() => handleDeleteItem(idx, iIdx)} className="p-0.5 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={10} /></button>
                                  </span>
                                )}
                              </li>
                              );
                            })}
                          </ul>
                          {isEditMode && (
                            <button onClick={() => handleAddItem(idx)} className="nasa-btn text-xs mt-3 flex items-center gap-1 self-start"><Plus size={12} /> Add Item</button>
                          )}
                        </motion.div>
                        </ChangeHighlight>
                        );
                      })}
                    </div>
                    {isEditMode && (
                      <button onClick={handleAddCat} className="nasa-btn text-sm flex items-center gap-2 mx-auto mb-4"><Plus size={14} /> Add Category</button>
                    )}
                  </div>
                </motion.div>
              )}

              {activeIndex === 2 && (
                /* CREDITS LAYER */
                <motion.div
                  key="credits-layer"
                  initial={{ opacity: 0, scale: 0.95, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -40 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full w-full flex-col justify-center px-6 md:px-10 py-12"
                >
                  <div className="mx-auto flex flex-col items-center justify-center gap-12 w-full max-w-6xl">
                    <div className="text-center w-full max-w-4xl mx-auto space-y-2 pb-6 border-b border-[rgba(0,212,255,0.15)]">
                      <h2 className="font-mono text-xl md:text-2xl uppercase tracking-[0.5em] text-nasa-light-cyan" style={{ color: "var(--text-primary)", textShadow: "0 0 15px rgba(255,255,255,0.2)" }}>
                         ///BEHIND VORTEX_
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6 w-full max-w-6xl mx-auto">
                      {data.credits.map((credit, idx) => {
                        const creditHasPending = isPending(`VortexCredit:id:${credit.id}`);
                        return (
                        <ChangeHighlight key={idx} entityRef={`VortexCredit:id:${credit.id}`}>
                        <div className={`flex items-baseline w-full gap-3 group/credit ${creditHasPending ? "pending-change-highlight" : ""}`}>
                          {/* Left: Name */}
                          <span className="shrink-0 font-display uppercase tracking-widest text-sm md:text-base whitespace-nowrap" style={{ color: "var(--text-primary)", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}>
                            {credit.name}
                          </span>

                          {/* Middle: Expanding Line */}
                          <div className="flex-1 border-b border-[rgba(255,255,255,0.15)] group-hover/credit:border-[var(--accent-color)] transition-colors duration-300 min-w-[30px] opacity-70 relative top-[-4px]" />

                          {/* Right: Role */}
                          <div className="flex shrink text-right max-w-[55%] lg:max-w-[45%]">
                            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] inline-block w-full" style={{ color: "var(--accent-color)" }}>
                              {credit.role}
                            </span>
                          </div>
                          {isEditMode && (
                            <span className="hidden group-hover/credit:flex gap-1 shrink-0">
                              <button onClick={() => handleEditCredit(idx)} className="p-0.5 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={10} /></button>
                              <button onClick={() => handleDeleteCredit(idx)} className="p-0.5 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={10} /></button>
                            </span>
                          )}
                        </div>
                        </ChangeHighlight>
                        );
                      })}
                    </div>
                    {isEditMode && (
                      <button onClick={handleAddCredit} className="nasa-btn text-sm flex items-center gap-2 mx-auto mt-6"><Plus size={14} /> Add Credit</button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Modals */}
      <ItemFormModal isOpen={!!catModal} onClose={() => setCatModal(null)}
        title={catModal?.mode === "edit" ? "Edit Category" : "Add Category"}
        fields={CAT_FIELDS} initialValues={catModal?.init ?? {}} onSubmit={handleCatSubmit}
      />
      <ItemFormModal isOpen={!!itemModal} onClose={() => setItemModal(null)}
        title={itemModal?.mode === "edit" ? "Edit Item" : "Add Item"}
        fields={ITEM_FIELDS} initialValues={itemModal?.init ?? {}} onSubmit={handleItemSubmit}
      />
      <ItemFormModal isOpen={!!creditModal} onClose={() => setCreditModal(null)}
        title={creditModal?.mode === "edit" ? "Edit Credit" : "Add Credit"}
        fields={CREDIT_FIELDS} initialValues={creditModal?.init ?? {}} onSubmit={handleCreditSubmit}
      />
    </div>
  );
}
