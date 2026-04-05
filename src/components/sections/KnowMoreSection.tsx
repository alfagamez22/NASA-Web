"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getSectionsByParentLS, addSection, updateSection, deleteSection, generateId } from "@/lib/data-store";
import { useEditMode } from "@/lib/edit-mode-context";
import ContentSectionCard from "@/components/content/ContentSectionCard";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";
import type { ContentSection } from "@/lib/types";

const SECTION_FIELDS: FormField[] = [
  { key: "title", label: "Title", required: true, placeholder: "e.g. Nokia MML & Alarms" },
  { key: "author", label: "Author", placeholder: "Author name" },
  { key: "authorUrl", label: "Author URL", type: "url", placeholder: "https://..." },
  { key: "description", label: "Description", type: "textarea", placeholder: "Description (HTML allowed)" },
  { key: "content", label: "Content", type: "textarea", placeholder: "Rich text content (HTML allowed)" },
  { key: "mediaType", label: "Media Type", type: "select", options: [
    { value: "google-slides", label: "Google Slides (gurl)" },
    { value: "youtube", label: "YouTube (yurl)" },
    { value: "image", label: "Image (url)" },
    { value: "iframe", label: "iFrame (url)" },
  ]},
  { key: "mediaUrl", label: "Media URL", type: "url", placeholder: "Paste gurl/yurl/url here" },
  { key: "buttonLabel", label: "Button Label", placeholder: "e.g. VIEW PRESENTATION" },
  { key: "buttonUrl", label: "Button URL", type: "url", placeholder: "https://..." },
];

export default function KnowMoreSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const sections = getSectionsByParentLS("know-more");

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);

  function sectionToFormValues(s: ContentSection): Record<string, string> {
    const media = s.media?.[0];
    return {
      title: s.title,
      author: s.author || "",
      authorUrl: s.authorUrl || "",
      description: s.description || "",
      content: s.content || "",
      mediaType: media?.type || "",
      mediaUrl: media?.gurl || media?.yurl || media?.url || "",
      buttonLabel: s.buttonLabel || "",
      buttonUrl: s.buttonUrl || "",
    };
  }

  function handleAdd(values: Record<string, string>) {
    const slug = generateId();
    const media = values.mediaType && values.mediaUrl ? [{
      type: values.mediaType as "google-slides" | "youtube" | "image" | "iframe",
      ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } :
          values.mediaType === "youtube" ? { yurl: values.mediaUrl } :
          { url: values.mediaUrl }),
    }] : undefined;

    addSection({
      slug,
      title: values.title,
      parentSlug: "know-more",
      order: sections.length,
      author: values.author || undefined,
      authorUrl: values.authorUrl || undefined,
      description: values.description || undefined,
      content: values.content || undefined,
      media,
      buttonLabel: values.buttonLabel || undefined,
      buttonUrl: values.buttonUrl || undefined,
    });
    markChanged();
    notifyChange("know-more", "add", values.title);
    refresh();
  }

  function handleEdit(values: Record<string, string>) {
    if (!editingSection) return;
    const media = values.mediaType && values.mediaUrl ? [{
      type: values.mediaType as "google-slides" | "youtube" | "image" | "iframe",
      ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } :
          values.mediaType === "youtube" ? { yurl: values.mediaUrl } :
          { url: values.mediaUrl }),
    }] : undefined;

    updateSection(editingSection.slug, {
      title: values.title,
      author: values.author || undefined,
      authorUrl: values.authorUrl || undefined,
      description: values.description || undefined,
      content: values.content || undefined,
      media,
      buttonLabel: values.buttonLabel || undefined,
      buttonUrl: values.buttonUrl || undefined,
    });
    markChanged();
    notifyChange("know-more", "edit", values.title);
    setEditingSection(null);
    refresh();
  }

  function handleDelete(section: ContentSection) {
    if (confirm(`Delete "${section.title}"?`)) {
      deleteSection(section.slug);
      markChanged();
      notifyChange("know-more", "delete", section.title);
      refresh();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 md:p-16 space-y-12"
      key={refreshKey}
    >
      <div className="flex items-center justify-between">
        <h2
          className="font-display text-7xl uppercase tracking-tighter pb-4"
          style={{
            borderBottom: "4px solid var(--border-color-strong)",
            textShadow: "0 0 10px var(--glow-color)",
            color: "var(--accent-color)",
          }}
        >
          KNOW MORE ABOUT...
        </h2>
        {isEditMode && (
          <button onClick={() => setShowModal(true)} className="nasa-btn text-xs flex items-center gap-1">
            <Plus size={14} /> ADD POST
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => (
          <div key={section.slug} className="relative group/sec">
            {isEditMode && (
              <div className="absolute top-2 right-2 z-30 flex gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                <button onClick={() => setEditingSection(section)} className="p-1.5 bg-black/70 text-cyan-400 hover:text-white rounded" title="Edit">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(section)} className="p-1.5 bg-black/70 text-red-400 hover:text-red-300 rounded" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <ContentSectionCard section={section} />
          </div>
        ))}
      </div>

      <ItemFormModal
        isOpen={showModal || !!editingSection}
        onClose={() => { setShowModal(false); setEditingSection(null); }}
        title={editingSection ? "EDIT POST" : "ADD POST"}
        fields={SECTION_FIELDS}
        initialValues={editingSection ? sectionToFormValues(editingSection) : undefined}
        onSubmit={editingSection ? handleEdit : handleAdd}
      />
    </motion.div>
  );
}
