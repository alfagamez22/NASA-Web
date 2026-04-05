"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getSectionsByParentLS, addSection, updateSection, deleteSection, generateId } from "@/lib/data-store";
import { useEditMode } from "@/lib/edit-mode-context";
import SlideCard from "@/components/content/SlideCard";
import TBAReport from "@/components/sections/TBAReport";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";
import type { ContentSection } from "@/lib/types";

const SECTION_FIELDS: FormField[] = [
  { key: "title", label: "Region/Section Title", required: true, placeholder: "e.g. LUZON" },
  { key: "mediaType", label: "Slide Type", type: "select", options: [
    { value: "google-slides", label: "Google Slides (gurl)" },
    { value: "iframe", label: "iFrame (url)" },
    { value: "image", label: "Image (url)" },
  ]},
  { key: "mediaUrl", label: "Slide URL", type: "url", placeholder: "Paste gurl/url here" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
];

interface RegionalReportSectionProps {
  reportType: string;
  moduleSlug: string;
}

export default function RegionalReportSection({ reportType, moduleSlug }: RegionalReportSectionProps) {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const regions = getSectionsByParentLS(moduleSlug);

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);

  function handleAdd(values: Record<string, string>) {
    const slug = generateId();
    const slides = values.mediaType && values.mediaUrl ? [{
      slug: generateId(),
      title: values.title,
      sectionSlug: slug,
      order: 0,
      layout: "single" as const,
      columns: [{
        type: "media" as const,
        media: {
          type: values.mediaType as "google-slides" | "iframe" | "image",
          ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } : { url: values.mediaUrl }),
        },
      }],
    }] : undefined;

    addSection({
      slug, title: values.title, parentSlug: moduleSlug, order: regions.length,
      description: values.description || undefined,
      slides,
    });
    markChanged();
    notifyChange(`report-${moduleSlug}`, "add", values.title);
    refresh();
  }

  function handleEdit(values: Record<string, string>) {
    if (!editingSection) return;
    const slides = values.mediaType && values.mediaUrl ? [{
      slug: editingSection.slides?.[0]?.slug || generateId(),
      title: values.title,
      sectionSlug: editingSection.slug,
      order: 0,
      layout: "single" as const,
      columns: [{
        type: "media" as const,
        media: {
          type: values.mediaType as "google-slides" | "iframe" | "image",
          ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } : { url: values.mediaUrl }),
        },
      }],
    }] : editingSection.slides;

    updateSection(editingSection.slug, {
      title: values.title,
      description: values.description || undefined,
      slides,
    });
    markChanged();
    notifyChange(`report-${moduleSlug}`, "edit", values.title);
    setEditingSection(null);
    refresh();
  }

  function handleDelete(section: ContentSection) {
    if (confirm(`Delete "${section.title}"?`)) {
      deleteSection(section.slug);
      markChanged();
      notifyChange(`report-${moduleSlug}`, "delete", section.title);
      refresh();
    }
  }

  if (regions.length === 0 && !isEditMode) {
    return <TBAReport title={`${reportType} REPORT`} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-0 text-center"
      key={refreshKey}
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
        {regions.map((region) => (
          <div key={region.slug} className="space-y-8 relative group/reg">
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
