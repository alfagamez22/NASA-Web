"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import MediaEmbed from "@/components/content/MediaEmbed";
import { useEditMode } from "@/lib/edit-mode-context";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";

const LS_KEY = "scc-portal-report-slides";

interface ReportSlide {
  id: string;
  label: string;
  gurl: string;
  colSpan?: number; // 1 or 2
}

const DEFAULT_SLIDES: ReportSlide[] = [
  { id: "left", label: "LEFT", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 1 },
  { id: "right", label: "RIGHT", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 1 },
  { id: "bottom", label: "BOTTOM", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 2 },
];

function getSlides(): ReportSlide[] {
  if (typeof window === "undefined") return DEFAULT_SLIDES;
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_SLIDES;
}
function saveSlides(slides: ReportSlide[]) { localStorage.setItem(LS_KEY, JSON.stringify(slides)); }

const SLIDE_FIELDS: FormField[] = [
  { key: "label", label: "Label", required: true, placeholder: "e.g. LEFT, RIGHT, BOTTOM" },
  { key: "gurl", label: "Google Slides URL", type: "url", required: true },
  { key: "colSpan", label: "Column Span", type: "select", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }] },
];

export default function ReportSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const slides = getSlides();
  void refreshKey;

  const [modal, setModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);

  function handleAdd() { setModal({ mode: "add" }); }
  function handleEdit(idx: number) {
    const s = slides[idx];
    setModal({ mode: "edit", idx, init: { label: s.label, gurl: s.gurl, colSpan: String(s.colSpan ?? 1) } });
  }
  function handleDelete(idx: number) {
    const s = slides.filter((_, i) => i !== idx); saveSlides(s);
    markChanged(); notifyChange("report", "delete", "report slide"); refresh();
  }
  function handleSubmit(vals: Record<string, string>) {
    const s = [...slides];
    const slide: ReportSlide = { id: crypto.randomUUID(), label: vals.label, gurl: vals.gurl, colSpan: parseInt(vals.colSpan) || 1 };
    if (modal?.mode === "edit" && modal.idx != null) { slide.id = s[modal.idx].id; s[modal.idx] = slide; }
    else { s.push(slide); }
    saveSlides(s); markChanged(); notifyChange("report", modal?.mode === "edit" ? "edit" : "add", vals.label); setModal(null); refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0 text-center"
    >
      {/* Hero Banner */}
      <div
        className="p-8 md:p-16 relative flex flex-col items-center justify-center min-h-[30vh]"
        style={{
          borderBottom: "2px solid var(--border-color)",
          background: "linear-gradient(to bottom, rgba(5,15,30,0.6), rgba(5,15,30,0.9))",
        }}
      >
        <h2 className="relative z-10 font-display text-7xl md:text-9xl uppercase tracking-tighter" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
          RAN REPORT
        </h2>
      </div>

      <div className="p-8 md:p-16 max-w-7xl mx-auto space-y-12">
        {/* Clickable Title Section */}
        <div
          className="border-y-4 py-6 cursor-pointer hover:bg-nasa-blue/20 transition-colors"
          style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <h3 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-center" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
            OFFICIAL NETWORK PHYSICAL LOCATION COUNT
          </h3>
        </div>

        {/* Media Embed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {slides.map((slide, idx) => (
            <div key={slide.id} className={`relative group/slide ${slide.colSpan === 2 ? "md:col-span-2" : ""}`}>
              {isEditMode && (
                <div className="absolute top-2 right-2 z-20 hidden group-hover/slide:flex gap-1">
                  <button onClick={() => handleEdit(idx)} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(idx)} className="p-1 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={12} /></button>
                </div>
              )}
              {slide.gurl ? (
                <MediaEmbed media={{ type: "google-slides", gurl: slide.gurl }} />
              ) : (
                <div className="nasa-card w-full h-[400px] flex items-center justify-center bg-black/20" style={{ border: "2px dashed var(--border-color)" }}>
                  <span className="font-mono text-nasa-gray">EMPTY SLOT ({slide.label})</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {isEditMode && (
          <button onClick={handleAdd} className="nasa-btn text-sm flex items-center gap-2 mx-auto"><Plus size={14} /> Add Slide</button>
        )}
      </div>

      <ItemFormModal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Slide" : "Add Slide"}
        fields={SLIDE_FIELDS} initialValues={modal?.init ?? { colSpan: "1" }} onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
