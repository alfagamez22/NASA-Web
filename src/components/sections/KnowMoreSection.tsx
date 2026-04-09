"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useEditMode } from "@/lib/edit-mode-context";
import { usePendingChanges } from "@/lib/pending-context";
import { useHighlight } from "@/lib/highlight-context";
import ContentSectionCard from "@/components/content/ContentSectionCard";
import ChangeHighlight from "@/components/ui/ChangeHighlight";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";
import type { ContentSection } from "@/lib/types";

function generateSlug() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const SECTION_FIELDS: FormField[] = [
  { key: "title", label: "Title", required: true, placeholder: "e.g. Nokia MML & Alarms" },
  { key: "author", label: "Author", placeholder: "Author name" },
  { key: "authorUrl", label: "Author URL", type: "url", placeholder: "https://..." },
  { key: "description", label: "Description", type: "textarea", placeholder: "Description (HTML allowed)" },
  { key: "content", label: "Content", type: "textarea", placeholder: "Rich text content (HTML allowed)" },
  { key: "mediaType", label: "Media Type", type: "select", options: [
    { value: "google-slides", label: "Google Slides (gurl)" },
    { value: "youtube", label: "YouTube (yurl)" },
    { value: "image", label: "Image" },
    { value: "iframe", label: "iFrame (url)" },
  ]},
  {
    key: "mediaUrl",
    label: "Media URL / Image",
    type: "url",
    placeholder: "Paste gurl/yurl/url here",
    conditionalImage: { watchKey: "mediaType", whenValue: "image" },
  },
  { key: "links", label: "External Links", type: "links" },
  { key: "buttonLabel", label: "Button Label", placeholder: "e.g. VIEW PRESENTATION" },
  { key: "buttonUrl", label: "Button URL", type: "url", placeholder: "https://..." },
];

export default function KnowMoreSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const { isPending, getPendingAdds } = usePendingChanges();
  const { isRecentlyChanged, refresh: refreshHighlights } = useHighlight();
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable heading
  const [heading, setHeading] = useState("KNOW MORE ABOUT...");
  const [editingHeading, setEditingHeading] = useState(false);
  const [headingDraft, setHeadingDraft] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.knowMoreHeading) setHeading(cfg.knowMoreHeading);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch("/api/sections?parent=know-more");
      if (res.ok) setSections(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

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
      links: s.links?.length ? JSON.stringify(s.links.map((l) => ({ label: l.label, url: l.url }))) : "[]",
      buttonLabel: s.buttonLabel || "",
      buttonUrl: s.buttonUrl || "",
    };
  }

  function buildMedia(values: Record<string, string>) {
    if (!values.mediaType || !values.mediaUrl) return undefined;
    return [{
      type: values.mediaType,
      ...(values.mediaType === "google-slides" ? { gurl: values.mediaUrl } :
          values.mediaType === "youtube" ? { yurl: values.mediaUrl } :
          { url: values.mediaUrl }),
    }];
  }

  async function handleAdd(values: Record<string, string>) {
    const slug = generateSlug();
    let parsedLinks: { label: string; url: string }[] = [];
    try { parsedLinks = values.links ? JSON.parse(values.links) : []; } catch { parsedLinks = []; }
    const apiBody = {
      slug, title: values.title, parentSlug: "know-more", order: sections.length,
      author: values.author || undefined, authorUrl: values.authorUrl || undefined,
      description: values.description || undefined, content: values.content || undefined,
      media: buildMedia(values),
      links: parsedLinks.filter((l) => l.label && l.url),
      buttonLabel: values.buttonLabel || undefined, buttonUrl: values.buttonUrl || undefined,
    };
    const applied = await notifyChange("know-more", "add", values.title, `ContentSection:slug:${slug}`, {
      apiUrl: "/api/sections", apiMethod: "POST", apiBody,
    });
    if (applied) {
      await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      markChanged();
      fetchSections();
      refreshHighlights();
    }
  }

  async function handleEdit(values: Record<string, string>) {
    if (!editingSection) return;
    const previous = { title: editingSection.title, description: editingSection.description, content: editingSection.content, author: editingSection.author, authorUrl: editingSection.authorUrl };
    let parsedLinks: { label: string; url: string }[] = [];
    try { parsedLinks = values.links ? JSON.parse(values.links) : []; } catch { parsedLinks = []; }
    const apiBody = {
      slug: editingSection.slug,
      title: values.title, author: values.author || undefined,
      authorUrl: values.authorUrl || undefined, description: values.description || undefined,
      content: values.content || undefined,
      media: buildMedia(values),
      links: parsedLinks.filter((l) => l.label && l.url),
      buttonLabel: values.buttonLabel || undefined, buttonUrl: values.buttonUrl || undefined,
    };
    const applied = await notifyChange("know-more", "edit", values.title, `ContentSection:slug:${editingSection.slug}`, {
      apiUrl: "/api/sections", apiMethod: "PUT", apiBody, previous,
    });
    if (applied) {
      await fetch("/api/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
      });
      markChanged();
      fetchSections();
      refreshHighlights();
    }
    setEditingSection(null);
  }

  async function handleDelete(section: ContentSection) {
    if (confirm(`Delete "${section.title}"?`)) {
      const applied = await notifyChange("know-more", "delete", section.title, `ContentSection:slug:${section.slug}`, {
        apiUrl: `/api/sections?slug=${section.slug}`, apiMethod: "DELETE", previous: section,
      });
      if (applied) {
        await fetch(`/api/sections?slug=${section.slug}`, { method: "DELETE" });
        markChanged();
        fetchSections();
        refreshHighlights();
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 md:p-16 space-y-12"
    >
      <div className="flex items-center justify-between">
        <div className="relative group/heading">
          {editingHeading ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = headingDraft.trim();
                if (trimmed) {
                  setHeading(trimmed);
                  try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ knowMoreHeading: trimmed }) }); } catch { /* ignore */ }
                }
                setEditingHeading(false);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={headingDraft}
                onChange={(e) => setHeadingDraft(e.target.value)}
                className="font-display text-7xl uppercase tracking-tighter bg-transparent outline-none"
                style={{ color: "var(--accent-color)", borderBottom: "2px solid var(--accent-color)" }}
                autoFocus
              />
              <button type="submit" className="text-green-400 hover:text-green-300"><Check size={20} /></button>
              <button type="button" onClick={() => setEditingHeading(false)} className="text-red-400 hover:text-red-300"><X size={20} /></button>
            </form>
          ) : (
            <h2
              className="font-display text-7xl uppercase tracking-tighter pb-4"
              style={{
                borderBottom: "4px solid var(--border-color-strong)",
                textShadow: "0 0 10px var(--glow-color)",
                color: "var(--accent-color)",
              }}
            >
              {heading}
            </h2>
          )}
          {isEditMode && !editingHeading && (
            <button
              onClick={() => { setHeadingDraft(heading); setEditingHeading(true); }}
              className="absolute top-2 right-2 z-50 p-1 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/heading:opacity-100 transition-opacity"
              title="Edit Heading"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
        {isEditMode && (
          <button onClick={() => setShowModal(true)} className="nasa-btn text-xs flex items-center gap-1">
            <Plus size={14} /> ADD POST
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => {
          const entityRef = `ContentSection:slug:${section.slug}`;
          const hasPending = isPending(entityRef);
          return (
          <ChangeHighlight key={section.slug} entityRef={entityRef} className={`relative group/sec ${hasPending ? "pending-change-highlight" : ""}`}>
            {hasPending && <span className="pending-change-badge">PENDING</span>}
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
          </ChangeHighlight>
        );
        })}
        {/* Pending add ghost cards */}
        {getPendingAdds("know-more").map((p) => (
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
        title={editingSection ? "EDIT POST" : "ADD POST"}
        fields={SECTION_FIELDS}
        initialValues={editingSection ? sectionToFormValues(editingSection) : undefined}
        onSubmit={editingSection ? handleEdit : handleAdd}
      />
    </motion.div>
  );
}
