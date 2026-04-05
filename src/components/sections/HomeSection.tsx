"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, GripVertical } from "lucide-react";
import { getCategoriesByParentLS, addCategory, updateCategory, deleteCategory, addToolToCategory, updateToolInCategory, deleteToolFromCategory, generateId } from "@/lib/data-store";
import { useEditMode } from "@/lib/edit-mode-context";
import CollapsibleCategory from "@/components/ui/CollapsibleCategory";
import ItemFormModal, { type FormField } from "@/components/edit/ItemFormModal";
import { CONTACT_NUMBERS } from "@/lib/constants";
import type { ToolCategory, ToolItem } from "@/lib/types";

const CATEGORY_FIELDS: FormField[] = [
  { key: "title", label: "Category Title", required: true, placeholder: "e.g. OPERATIONS" },
];

const TOOL_FIELDS: FormField[] = [
  { key: "title", label: "Tool Name", required: true, placeholder: "e.g. Site Tracker" },
  { key: "url", label: "URL", type: "url", required: true, placeholder: "https://..." },
  { key: "icon", label: "Icon Name", required: true, placeholder: "e.g. Monitor, Database, Globe" },
  { key: "description", label: "Description", placeholder: "Short description" },
];

export default function HomeSection() {
  const { isEditMode, markChanged, notifyChange } = useEditMode();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const categories = getCategoriesByParentLS("home");
  const backgroundVideoOpacity = 10.08;

  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<{ tool: ToolItem; categorySlug: string } | null>(null);
  const [targetCategorySlug, setTargetCategorySlug] = useState("");

  function handleAddCategory(values: Record<string, string>) {
    const slug = generateId();
    addCategory({
      slug,
      title: values.title,
      parentSlug: "home",
      order: categories.length,
      tools: [],
    });
    markChanged();
    notifyChange("home", "add", values.title);
    refresh();
  }

  function handleEditCategory(values: Record<string, string>) {
    if (!editingCategory) return;
    updateCategory(editingCategory.slug, { title: values.title });
    markChanged();
    notifyChange("home", "edit", values.title);
    setEditingCategory(null);
    refresh();
  }

  function handleDeleteCategory(cat: ToolCategory) {
    if (confirm(`Delete category "${cat.title}" and all its tools?`)) {
      deleteCategory(cat.slug);
      markChanged();
      notifyChange("home", "delete", cat.title);
      refresh();
    }
  }

  function handleAddTool(values: Record<string, string>) {
    const slug = generateId();
    const cat = categories.find((c) => c.slug === targetCategorySlug);
    addToolToCategory(targetCategorySlug, {
      slug,
      title: values.title,
      url: values.url,
      icon: values.icon || "Monitor",
      description: values.description || "",
      categorySlug: targetCategorySlug,
      order: cat ? cat.tools.length : 0,
    });
    markChanged();
    notifyChange("home", "add", values.title);
    refresh();
  }

  function handleEditTool(values: Record<string, string>) {
    if (!editingTool) return;
    updateToolInCategory(editingTool.categorySlug, editingTool.tool.slug, {
      title: values.title,
      url: values.url,
      icon: values.icon || "Monitor",
      description: values.description || "",
    });
    markChanged();
    notifyChange("home", "edit", values.title);
    setEditingTool(null);
    refresh();
  }

  function handleDeleteTool(categorySlug: string, tool: ToolItem) {
    if (confirm(`Delete tool "${tool.title}"?`)) {
      deleteToolFromCategory(categorySlug, tool.slug);
      markChanged();
      notifyChange("home", "delete", tool.title);
      refresh();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-0"
      key={refreshKey}
    >
      {/* Tool Categories Grid */}
      <div className="tool-categories-wrapper w-full overflow-hidden bg-nasa-darker" style={{ position: "relative", zIndex: 0, backgroundColor: "rgba(0, 8, 20, 1)" }}>
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: backgroundVideoOpacity, mixBlendMode: "overlay", zIndex: 0 }}
        >
          <source src="/SERVERRACKSBEHIND.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: "rgba(0, 10, 20, 0.88)", zIndex: 5 }} />

        {/* Add Category Button (Edit Mode) — outside scrollable-row to avoid row-direction layout bug */}
        {isEditMode && (
          <div className="relative z-10 w-full flex justify-end px-8 pt-6 pb-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="nasa-btn text-xs flex items-center gap-1"
            >
              <Plus size={14} /> ADD CATEGORY
            </button>
          </div>
        )}

        <div className="scrollable-row relative z-10 flex flex-col items-center justify-center transition-all duration-300 w-full no-scrollbar px-4 pt-4 pb-10">
          <div className="w-full max-w-[1500px] flex flex-col md:flex-row md:justify-center gap-4">
            {categories.map((category) => (
              <div key={category.slug} className="relative group/cat flex-1 min-w-0">
                {isEditMode && (
                  <div className="absolute top-1 right-1 z-30 flex gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingCategory(category); }}
                      className="p-1 bg-black/70 text-cyan-400 hover:text-white rounded"
                      title="Edit Category"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 bg-black/70 text-red-400 hover:text-red-300 rounded"
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={() => { setTargetCategorySlug(category.slug); setShowToolModal(true); }}
                      className="p-1 bg-black/70 text-green-400 hover:text-green-300 rounded"
                      title="Add Tool"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
                <CollapsibleCategory
                  category={category}
                  isEditMode={isEditMode}
                  onEditTool={(tool) => setEditingTool({ tool, categorySlug: category.slug })}
                  onDeleteTool={(tool) => handleDeleteTool(category.slug, tool)}
                />
              </div>
            ))}
          </div>

        </div>
      </div>

      <style jsx>{`
        .tool-categories-wrapper {
          mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
          position: relative;
          background-color: var(--bg-darker);
          z-index: 1;
        }
        .scrollable-row {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0;
        }
        @media (min-width: 769px) {
          .scrollable-row {
            flex-direction: row;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: clamp(4px, 0.5vw, 12px);
            padding: 0 2%;
          }
        }
        .scrollable-row::-webkit-scrollbar { height: 4px; }
        .scrollable-row::-webkit-scrollbar-track { background: transparent; }
        .scrollable-row::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
      `}</style>

      {/* Category Modal */}
      <ItemFormModal
        isOpen={showCategoryModal || !!editingCategory}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        title={editingCategory ? "EDIT CATEGORY" : "ADD CATEGORY"}
        fields={CATEGORY_FIELDS}
        initialValues={editingCategory ? { title: editingCategory.title } : undefined}
        onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
      />

      {/* Tool Modal */}
      <ItemFormModal
        isOpen={showToolModal || !!editingTool}
        onClose={() => { setShowToolModal(false); setEditingTool(null); }}
        title={editingTool ? "EDIT TOOL" : "ADD TOOL"}
        fields={TOOL_FIELDS}
        initialValues={editingTool ? { title: editingTool.tool.title, url: editingTool.tool.url, icon: editingTool.tool.icon, description: editingTool.tool.description || "" } : undefined}
        onSubmit={editingTool ? handleEditTool : handleAddTool}
      />
    </motion.div>
  );
}
