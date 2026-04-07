"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
import { usePendingChanges } from "@/lib/pending-context";
import { useHighlight } from "@/lib/highlight-context";
import SlideCard from "@/components/content/SlideCard";
import ChangeHighlight from "@/components/ui/ChangeHighlight";
import TBAReport from "@/components/sections/TBAReport";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";
import type { ContentSection } from "@/lib/types";

function generateSlug() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const SECTION_FIELDS: FormField[] = [
  { key: "title", label: "Region/Section Title", required: true, placeholder: "e.g. LUZON" },
  { key: "mediaType", label: "Slide Type", type: "select", options: [
    { value: "google-slides", label: "Google Slides (gurl)" },
    { value: "iframe", label: "iFrame (url)" },
    { value: "image", label: "Image" },
  ]},
  {
    key: "mediaUrl",
    label: "Slide URL / Image",
    type: "url",
    placeholder: "Paste gurl/url here",
    conditionalImage: { watchKey: "mediaType", whenValue: "image" },
  },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
];

interface RegionalReportSectionProps {
  reportType: string;
  moduleSlug: string;
}

export default function RegionalReportSection({ reportType, moduleSlug }: RegionalReportSectionProps) {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending, getPendingAdds } = usePendingChanges();
  const { refresh: refreshHighlights } = useHighlight();
  const [regions, setRegions] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch(`/api/sections?parent=${moduleSlug}`);
      if (res.ok) setRegions(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [moduleSlug]);

  useEffect(() => { fetchRegions(); }, [fetchRegions]);

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);

  function buildSlides(values: Record<string, string>, sectionSlug: string, existingSlideSlug?: string) {
    if (!values.mediaType || !values.mediaUrl) return undefined;
    return [{
      slug: existingSlideSlug || generateSlug(),
      title: values.title,
      sectionSlug,
      layout: "single",
      columns: [{
        type: "media",
        media: {
          type: values.mediaType,
          ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } : { url: values.mediaUrl }),
        },
      }],
    }];
  }

  async function handleAdd(values: Record<string, string>) {
    const slug = generateSlug();
    const apiBody = {
      slug, title: values.title, parentSlug: moduleSlug, order: regions.length,
      description: values.description || undefined,
      slides: buildSlides(values, slug),
    };
    const applied = await notifyChange(`report-${moduleSlug}`, "add", values.title, `ContentSection:slug:${slug}`, {
      apiUrl: "/api/sections", apiMethod: "POST", apiBody,
    });
    if (applied) {
      await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      markChanged();
      fetchRegions();
      refreshHighlights();
    }
  }

  async function handleEdit(values: Record<string, string>) {
    if (!editingSection) return;
    const previous = { title: editingSection.title, description: editingSection.description };
    const apiBody = {
      slug: editingSection.slug,
      title: values.title,
      description: values.description || undefined,
      slides: buildSlides(values, editingSection.slug, editingSection.slides?.[0]?.slug),
    };
    const applied = await notifyChange(`report-${moduleSlug}`, "edit", values.title, `ContentSection:slug:${editingSection.slug}`, {
      apiUrl: "/api/sections", apiMethod: "PUT", apiBody, previous,
    });
    if (applied) {
      await fetch("/api/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      markChanged();
      fetchRegions();
      refreshHighlights();
    }
    setEditingSection(null);
  }

  async function handleDelete(section: ContentSection) {
    if (confirm(`Delete "${section.title}"?`)) {
      const applied = await notifyChange(`report-${moduleSlug}`, "delete", section.title, `ContentSection:slug:${section.slug}`, {
        apiUrl: `/api/sections?slug=${section.slug}`, apiMethod: "DELETE", previous: section,
      });
      if (applied) {
        await fetch(`/api/sections?slug=${section.slug}`, { method: "DELETE" });
        markChanged();
        fetchRegions();
        refreshHighlights();
      }
    }
  }

  if (regions.length === 0 && !isEditMode && !loading) {
    return <TBAReport title={`${reportType} REPORT`} />;
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
          {reportType} REPORT
        </h2>
        {isEditMode && (
          <button onClick={() => setShowModal(true)} className="relative z-10 mt-6 nasa-btn text-xs flex items-center gap-1">
            <Plus size={14} /> ADD SECTION
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-16 py-12 px-4 md:px-8">
        {regions.map((region) => {
          const entityRef = `ContentSection:slug:${region.slug}`;
          const hasPending = isPending(entityRef);
          return (
          <ChangeHighlight key={region.slug} entityRef={entityRef} className={`space-y-8 relative group/reg ${hasPending ? "pending-change-highlight" : ""}`}>
            {hasPending && <span className="pending-change-badge">PENDING</span>}
            {isEditMode && (
              <div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover/reg:opacity-100 transition-opacity">
                <button onClick={() => setEditingSection(region)} className="p-1.5 bg-black/70 text-cyan-400 hover:text-white rounded" title="Edit">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(region)} className="p-1.5 bg-black/70 text-red-400 hover:text-red-300 rounded" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div
              className="py-4 border-y-4"
              style={{ borderColor: "var(--border-color-strong)", backgroundColor: "var(--bg-tertiary)" }}
            >
              <h3 className="font-display text-4xl md:text-5xl uppercase tracking-tighter text-center tracking-wide" style={{ textShadow: "0 0 10px rgba(0,0,0,0.5)", color: "var(--text-primary)" }}>
                {region.title}
              </h3>
            </div>
            <div className="space-y-8 flex flex-col items-center">
              {region.slides?.map((slide) => (
                <div key={slide.slug} className="w-full">
                  <SlideCard slide={slide} />
                </div>
              ))}
            </div>
          </ChangeHighlight>
        );
        })}
        {/* Pending add ghost cards */}
        {getPendingAdds(`report-${moduleSlug}`).map((p) => (
          <div key={p.id} className="relative pending-add-highlight nasa-card opacity-70" style={{ minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="pending-add-badge">PENDING</span>
            <p className="font-mono text-sm text-green-400 uppercase tracking-wider">{p.itemName}</p>
            <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Awaiting approval</p>
          </div>
        ))}
      </div>

      <ItemFormModal
        isOpen={showModal || !!editingSection}
        onClose={() => { setShowModal(false); setEditingSection(null); }}
        title={editingSection ? "EDIT SECTION" : "ADD SECTION"}
        fields={SECTION_FIELDS}
        initialValues={editingSection ? {
          title: editingSection.title,
          description: editingSection.description || "",
          mediaType: editingSection.slides?.[0]?.columns?.[0]?.media?.type || "",
          mediaUrl: editingSection.slides?.[0]?.columns?.[0]?.media?.gurl || editingSection.slides?.[0]?.columns?.[0]?.media?.url || "",
        } : undefined}
        onSubmit={editingSection ? handleEdit : handleAdd}
      />
    </motion.div>
  );
}
