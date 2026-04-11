"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "url" | "image" | "links";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  /** When set, renders as ImageUpload instead of URL input when the watched field equals the given value */
  conditionalImage?: { watchKey: string; whenValue: string };
}

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
}

export default function ItemFormModal({ isOpen, onClose, title, fields, initialValues, onSubmit }: ItemFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  // Separate state for "links" fields — array of {label, url} pairs
  const [linksValues, setLinksValues] = useState<Record<string, { label: string; url: string }[]>>({});

  useEffect(() => {
    if (isOpen) {
      const init: Record<string, string> = {};
      const initLinks: Record<string, { label: string; url: string }[]> = {};
      fields.forEach((f) => {
        if (f.type === "links") {
          try {
            initLinks[f.key] = initialValues?.[f.key] ? JSON.parse(initialValues[f.key]) : [];
          } catch {
            initLinks[f.key] = [];
          }
        } else {
          init[f.key] = initialValues?.[f.key] || "";
        }
      });
      setValues(init);
      setLinksValues(initLinks);
    }
  }, [isOpen, fields, initialValues]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const merged: Record<string, string> = { ...values };
    for (const [key, arr] of Object.entries(linksValues)) {
      merged[key] = JSON.stringify(arr.filter((l) => l.label || l.url));
    }
    onSubmit(merged);
    onClose();
  };

  function addLink(key: string) {
    setLinksValues((prev) => ({ ...prev, [key]: [...(prev[key] || []), { label: "", url: "" }] }));
  }

  function updateLink(key: string, idx: number, field: "label" | "url", val: string) {
    setLinksValues((prev) => {
      const arr = [...(prev[key] || [])];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...prev, [key]: arr };
    });
  }

  function removeLink(key: string, idx: number) {
    setLinksValues((prev) => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== idx) }));
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 space-y-4 relative max-h-[85vh] overflow-y-auto" style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)", border: "2px solid var(--border-color-strong)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-nasa-gray hover:text-white transition-colors">
          <X size={18} />
        </button>
        <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none resize-y"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              ) : field.type === "select" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  required={field.required}
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none cursor-pointer"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-primary)" }}
                >
                  <option value="">Select...</option>
                  {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === "image" ? (
                <ImageUpload
                  value={values[field.key] || ""}
                  onChange={(dataUrl) => setValues((v) => ({ ...v, [field.key]: dataUrl }))}
                  placeholder={field.placeholder}
                />
              ) : field.type === "links" ? (
                <div className="space-y-2">
                  {(linksValues[field.key] || []).map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex flex-col gap-1 flex-1">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(field.key, idx, "label", e.target.value)}
                          placeholder="Label (e.g. Google Form)"
                          className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(field.key, idx, "url", e.target.value)}
                          placeholder="https://..."
                          className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLink(field.key, idx)}
                        className="mt-1 p-1.5 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLink(field.key)}
                    className="nasa-btn text-xs flex items-center gap-1"
                  >
                    <Plus size={12} /> ADD LINK
                  </button>
                </div>
              ) : field.conditionalImage && values[field.conditionalImage.watchKey] === field.conditionalImage.whenValue ? (
                <ImageUpload
                  value={values[field.key] || ""}
                  onChange={(dataUrl) => setValues((v) => ({ ...v, [field.key]: dataUrl }))}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type === "url" ? "url" : "text"}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="nasa-btn text-xs">SAVE</button>
            <button type="button" onClick={onClose} className="nasa-btn text-xs" style={{ color: "var(--text-secondary)" }}>CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}
