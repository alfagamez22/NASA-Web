"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import MediaEmbed from "@/domains/sections/components/MediaEmbed";
import { useEditMode } from "@/shared/contexts/edit-mode-context";
import { usePendingChanges } from "@/shared/contexts/pending-context";
import { useHighlight } from "@/shared/contexts/highlight-context";
import ChangeHighlight from "@/shared/components/ui/ChangeHighlight";
import ItemFormModal, { type FormField } from "@/domains/workflow/components/ItemFormModal";

interface ReportSlide {
  id: string;
  label: string;
  gurl: string;
  description?: string;
  colSpan?: number;
}

const DEFAULT_SLIDES: ReportSlide[] = [
  { id: "left", label: "LEFT", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 1 },
  { id: "right", label: "RIGHT", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 1 },
  { id: "bottom", label: "BOTTOM", gurl: "https://docs.google.com/presentation/d/1rDwQYbOKt2HN9sdf2brkJl_QB3uxzSv088CozCp80rg/edit?slide=id.g5d479e855d_0_25#slide=id.g5d479e855d_0_25", colSpan: 2 },
];

function sectionsToSlides(sections: Array<{ slug: string; title: string; description?: string; colSpan?: number; media?: Array<{ gurl?: string }> }>): ReportSlide[] {
  return sections.map((s) => ({
    id: s.slug,
    label: s.title,
    gurl: s.media?.[0]?.gurl || "",
    description: s.description || "",
    colSpan: s.colSpan ?? 1,
  }));
}

function generateSlug() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const SLIDE_FIELDS: FormField[] = [
  { key: "label", label: "Title", required: true, placeholder: "e.g. LEFT, RIGHT, BOTTOM" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
  { key: "mediaType", label: "Media Type", type: "select", options: [
    { value: "google-slides", label: "Google Slides (gurl)" },
    { value: "youtube", label: "YouTube (yurl)" },
    { value: "image", label: "Image" },
    { value: "iframe", label: "iFrame (url)" },
  ]},
  {
    key: "gurl",
    label: "Media URL / Image",
    type: "url",
    placeholder: "Paste gurl/yurl/url here (optional)",
    conditionalImage: { watchKey: "mediaType", whenValue: "image" },
  },
  { key: "colSpan", label: "Column Span", type: "select", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }] },
];

export default function ReportSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending, getPendingAdds } = usePendingChanges();
  const { refresh: refreshHighlights } = useHighlight();
  const [slides, setSlides] = useState<ReportSlide[]>(DEFAULT_SLIDES);
  const [loaded, setLoaded] = useState(false);

  // Editable headings
  const [heading, setHeading] = useState("RAN REPORT");
  const [subheading, setSubheading] = useState("OFFICIAL NETWORK PHYSICAL LOCATION COUNT");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.reportHeading) setHeading(cfg.reportHeading);
          if (cfg.reportSubheading) setSubheading(cfg.reportSubheading);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  function startFieldEdit(field: string, value: string) { setEditingField(field); setFieldDraft(value); }
  async function saveFieldEdit(field: string, setter: (v: string) => void) {
    const trimmed = fieldDraft.trim();
    if (trimmed) { setter(trimmed); try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: trimmed }) }); } catch { /* ignore */ } }
    setEditingField(null);
  }

  const fetchSlides = useCallback(async () => {
    try {
      const res = await fetch("/api/sections?parent=report");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setSlides(sectionsToSlides(data));
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const [modal, setModal] = useState<{ mode: "add" | "edit"; idx?: number; init?: Record<string, string> } | null>(null);

  function handleAdd() { setModal({ mode: "add" }); }
  function handleEdit(idx: number) {
    const s = slides[idx];
    setModal({ mode: "edit", idx, init: { label: s.label, gurl: s.gurl, description: (s as ReportSlide & { description?: string }).description || "", mediaType: "google-slides", colSpan: String(s.colSpan ?? 1) } });
  }

  async function handleDelete(idx: number) {
    const slide = slides[idx];
    const applied = await notifyChange("report", "delete", slide.label, `ReportSlide:id:${slide.id}`, {
      apiUrl: `/api/sections?slug=${slide.id}`, apiMethod: "DELETE", previous: slide,
    });
    if (applied) {
      await fetch(`/api/sections?slug=${slide.id}`, { method: "DELETE" });
      markChanged();
      fetchSlides();
      refreshHighlights();
    }
  }

  async function handleSubmit(vals: Record<string, string>) {
    const colSpan = parseInt(vals.colSpan) || 1;
    const mediaType = vals.mediaType || "google-slides";
    const mediaUrl = vals.gurl || "";
    const buildMedia = () => {
      if (!mediaUrl) return undefined;
      return [{
        type: mediaType,
        ...(mediaType === "google-slides" ? { gurl: mediaUrl } :
            mediaType === "youtube" ? { yurl: mediaUrl } :
            { url: mediaUrl }),
      }];
    };
    if (modal?.mode === "edit" && modal.idx != null) {
      const slide = slides[modal.idx];
      const previous = { label: slide.label, gurl: slide.gurl, colSpan: slide.colSpan };
      const apiBody = {
        slug: slide.id, title: vals.label, colSpan,
        description: vals.description || undefined,
        media: buildMedia() ?? [{ type: "google-slides", gurl: mediaUrl }],
      };
      const applied = await notifyChange("report", "edit", vals.label, `ReportSlide:id:${slide.id}`, {
        apiUrl: "/api/sections", apiMethod: "PUT", apiBody, previous,
      });
      if (applied) {
        await fetch("/api/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchSlides();
        refreshHighlights();
      }
    } else {
      const slug = generateSlug();
      const apiBody = {
        slug, title: vals.label, parentSlug: "report", order: slides.length, colSpan,
        description: vals.description || undefined,
        media: buildMedia() ?? [{ type: "google-slides", gurl: mediaUrl }],
      };
      const applied = await notifyChange("report", "add", vals.label, `ContentSection:slug:${slug}`, {
        apiUrl: "/api/sections", apiMethod: "POST", apiBody,
      });
      if (applied) {
        await fetch("/api/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        });
        markChanged();
        fetchSlides();
        refreshHighlights();
      }
    }
    setModal(null);
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
        <div className="relative z-10 group/rh">
          {editingField === "reportHeading" ? (
            <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("reportHeading", setHeading); }} className="flex items-center gap-2">
              <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-7xl md:text-9xl uppercase tracking-tighter bg-transparent outline-none text-center" style={{ color: "var(--text-primary)", borderBottom: "2px solid var(--accent-color)" }} autoFocus />
              <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={20} /></button>
              <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={20} /></button>
            </form>
          ) : (
            <h2 className="font-display text-7xl md:text-9xl uppercase tracking-tighter" style={{ textShadow: "0 0 20px var(--glow-color)", color: "var(--text-primary)" }}>
              {heading}
            </h2>
          )}
          {isEditMode && editingField !== "reportHeading" && (
            <button onClick={() => startFieldEdit("reportHeading", heading)} className="absolute top-2 right-2 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/rh:opacity-100 transition-opacity" title="Edit Heading"><Edit2 size={14} /></button>
          )}
        </div>
      </div>

      <div className="p-8 md:p-16 max-w-7xl mx-auto space-y-12">
        {/* Clickable Title Section */}
        <div
          className="border-y-4 py-6 cursor-pointer hover:bg-nasa-blue/20 transition-colors relative group/rs"
          style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          {editingField === "reportSubheading" ? (
            <form onSubmit={(e) => { e.preventDefault(); saveFieldEdit("reportSubheading", setSubheading); }} className="flex items-center justify-center gap-2">
              <input type="text" value={fieldDraft} onChange={(e) => setFieldDraft(e.target.value)} className="font-display text-4xl md:text-5xl uppercase tracking-tighter bg-transparent outline-none text-center w-full" style={{ color: "var(--text-primary)", borderBottom: "2px solid var(--accent-color)" }} autoFocus />
              <button type="submit" className="text-green-400 hover:text-green-300" title="Save"><Check size={18} /></button>
              <button type="button" onClick={() => setEditingField(null)} className="text-red-400 hover:text-red-300" title="Cancel"><X size={18} /></button>
            </form>
          ) : (
            <h3 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-center" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)" }}>
              {subheading}
            </h3>
          )}
          {isEditMode && editingField !== "reportSubheading" && (
            <button onClick={() => startFieldEdit("reportSubheading", subheading)} className="absolute top-2 right-2 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/rs:opacity-100 transition-opacity" title="Edit Subheading"><Edit2 size={14} /></button>
          )}
        </div>

        {/* Media Embed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {slides.map((slide, idx) => {
            const entityRef = `ContentSection:slug:${slide.id}`;
            const hasPending = isPending(entityRef);
            return (
            <ChangeHighlight key={slide.id} entityRef={entityRef} className={`relative group/slide ${slide.colSpan === 2 ? "md:col-span-2" : ""} ${hasPending ? "pending-change-highlight" : ""}`}>
              {hasPending && <span className="pending-change-badge">PENDING</span>}
              {isEditMode && (
                <div className="absolute top-2 right-2 z-20 hidden group-hover/slide:flex gap-1">
                  <button onClick={() => handleEdit(idx)} className="p-1 bg-cyan-600/80 rounded hover:bg-cyan-500"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(idx)} className="p-1 bg-red-600/80 rounded hover:bg-red-500"><Trash2 size={12} /></button>
                </div>
              )}
              <div className="nasa-card overflow-hidden" style={{ border: "1px solid var(--border-color-strong)" }}>
                {/* Card Title */}
                <div className="p-4 border-b" style={{ borderColor: "var(--border-color)" }}>
                  <h4 className="font-display text-xl uppercase tracking-wider" style={{ color: "var(--accent-color)", textShadow: "0 0 8px var(--glow-color)" }}>{slide.label}</h4>
                  {slide.description && (
                    <p className="font-mono text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{slide.description}</p>
                  )}
                </div>
                {/* Media */}
                {slide.gurl ? (
                  <MediaEmbed media={{ type: "google-slides", gurl: slide.gurl }} />
                ) : (
                  <div className="w-full h-[300px] flex items-center justify-center bg-black/20" style={{ border: "2px dashed var(--border-color)" }}>
                    <span className="font-mono text-nasa-gray">NO MEDIA — {slide.label}</span>
                  </div>
                )}
              </div>
            </ChangeHighlight>
            );
            })}
          {/* Pending add ghost cards */}
          {getPendingAdds("report").map((p) => (
            <div key={p.id} className="relative pending-add-highlight nasa-card opacity-70" style={{ minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="pending-add-badge">PENDING</span>
              <p className="font-mono text-sm text-green-400 uppercase tracking-wider">{p.itemName}</p>
              <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Awaiting approval</p>
            </div>
          ))}
        </div>
        {isEditMode && (
          <button onClick={handleAdd} className="nasa-btn text-sm flex items-center gap-2 mx-auto"><Plus size={14} /> Add Slide</button>
        )}
      </div>

      <ItemFormModal isOpen={!!modal} onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Slide" : "Add Slide"}
        fields={SLIDE_FIELDS} initialValues={modal?.init ?? { colSpan: "1", mediaType: "google-slides" }} onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
