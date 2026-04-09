"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Settings, LogOut, Pencil, X, Check, Bell, Move, Edit2, Plus, Trash2, Shield, ChevronDown, ChevronUp, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEditMode } from "@/lib/edit-mode-context";


import SearchModal from "./SearchModal";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import EditorNotificationPanel from "@/components/editor/EditorNotificationPanel";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";
import { usePendingChanges } from "@/lib/pending-context";

interface SubNavItem { display: string; href: string; format?: string }
interface ModuleData { id: string; slug: string; display: string; href: string; format?: string | null; subNav?: SubNavItem[] | null }

export default function Header() {
  const pathname = usePathname() ?? "";
  const { user, isAdmin, isSuperAdmin, isEditor, logout } = useAuth();
  const { isEditMode, isCanvasMode, enterEditMode, cancelEdit, applyEdit, toggleCanvasMode, showCancelDialog, confirmCancel, denyCancelDialog } = useEditMode();
  const { unresolvedCount, myPending } = usePendingChanges();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditorNotificationsOpen, setIsEditorNotificationsOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);

  // Editable header title from site config
  const [headerTitle, setHeaderTitle] = useState("NASA");
  const [editingHeaderTitle, setEditingHeaderTitle] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState("NASA");
  const [headerImage, setHeaderImage] = useState("");
  const [showHeaderPopup, setShowHeaderPopup] = useState(false);
  const [headerPopupDraft, setHeaderPopupDraft] = useState("");
  const [headerPopupImage, setHeaderPopupImage] = useState("");

  // Collapse toggle for nav edit controls
  const [editNavExpanded, setEditNavExpanded] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/site-config");
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.headerTitle) setHeaderTitle(cfg.headerTitle);
          if (cfg.headerImage) setHeaderImage(cfg.headerImage);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Live nav data from DB
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/modules");
      if (res.ok) setModules(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchModules(); }, [fetchModules, refreshKey]);

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    mode: "edit-label" | "add-sub" | "edit-sub" | "add-module";
    module?: ModuleData;
    subIdx?: number;
  } | null>(null);
  const [formDisplay, setFormDisplay] = useState("");
  const [formFormat, setFormFormat] = useState<string>("A");

  function openEditLabel(mod: ModuleData) {
    setFormDisplay(mod.display);
    setEditModal({ mode: "edit-label", module: mod });
  }

  function openAddSub(mod: ModuleData) {
    setFormDisplay("");
    setFormFormat("A");
    setEditModal({ mode: "add-sub", module: mod });
  }

  function openEditSub(mod: ModuleData, idx: number) {
    const sub = (mod.subNav ?? [])[idx];
    setFormDisplay(sub?.display ?? "");
    setFormFormat(sub?.format ?? "A");
    setEditModal({ mode: "edit-sub", module: mod, subIdx: idx });
  }

  function openAddModule() {
    setFormDisplay("");
    setEditModal({ mode: "add-module" });
  }

  async function saveModule(id: string, data: { display?: string; subNav?: SubNavItem[] }) {
    try {
      await fetch("/api/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
    } catch { /* ignore */ }
    setRefreshKey((k) => k + 1);
  }

  function handleEditLabelSubmit() {
    if (!editModal || !editModal.module || !formDisplay.trim()) return;
    saveModule(editModal.module.id, { display: formDisplay.trim() });
    setEditModal(null);
  }

  function handleAddSubSubmit() {
    if (!editModal || !editModal.module || !formDisplay.trim()) return;
    const mod = editModal.module;
    const existing = mod.subNav ?? [];
    const slug = formDisplay.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const parentHref = mod.href === "/" ? "" : mod.href;
    const newSub: SubNavItem = { display: formDisplay.trim().toUpperCase(), href: `${parentHref}/${slug}`, format: formFormat };
    saveModule(mod.id, { subNav: [...existing, newSub] });
    setEditModal(null);
  }

  function handleEditSubSubmit() {
    if (!editModal || editModal.subIdx === undefined || !formDisplay.trim() || !editModal.module) return;
    const mod = editModal.module;
    const subs = [...(mod.subNav ?? [])];
    subs[editModal.subIdx] = { ...subs[editModal.subIdx], display: formDisplay.trim().toUpperCase(), format: formFormat };
    saveModule(mod.id, { subNav: subs });
    setEditModal(null);
  }

  async function handleAddModuleSubmit() {
    if (!formDisplay.trim()) return;
    try {
      await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display: formDisplay.trim(), format: formFormat }),
      });
    } catch { /* ignore */ }
    setRefreshKey((k) => k + 1);
    setEditModal(null);
  }

  async function handleDeleteModule(mod: ModuleData) {
    if (!confirm(`Delete "${mod.display}" tab and all its sub-items?`)) return;
    try {
      await fetch(`/api/modules?id=${mod.id}`, { method: "DELETE" });
    } catch { /* ignore */ }
    setRefreshKey((k) => k + 1);
  }

  async function handleDeleteSub(mod: ModuleData, idx: number) {
    const sub = (mod.subNav ?? [])[idx];
    if (!confirm(`Delete "${sub.display}"?`)) return;
    const subs = [...(mod.subNav ?? [])];
    subs.splice(idx, 1);
    saveModule(mod.id, { subNav: subs });
  }

  const canEdit = isAdmin || isEditor;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnreadCount(Array.isArray(data) ? data.filter((n: { read: boolean }) => !n.read).length : 0);
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  // Build nav items from modules
  const navItems = modules.map((m) => ({
    label: m.slug.toUpperCase().replace(/-/g, ""),
    href: m.href,
    display: m.display,
    subItems: m.subNav ?? undefined,
    _module: m,
  }));

  return (
    <>
      <nav className="sticky top-0 bg-nasa-darker z-50 flex flex-wrap items-stretch" style={{ borderBottom: "2px solid var(--border-color-strong)", backgroundColor: "var(--bg-secondary)" }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 bg-nasa-blue text-nasa-light-cyan z-50 overflow-visible relative group/logo" style={{ borderRight: "2px solid var(--border-color-strong)", background: "linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))", color: "var(--accent-light)" }}>
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            <Image src="/broadcast.gif" alt="SCC RAN Logo" width={54} height={54} unoptimized className="absolute max-w-none object-contain" />
          </div>
          {headerImage ? (
            <img src={headerImage} alt={headerTitle} className="h-8 max-w-[120px] object-contain" />
          ) : (
            <span className="font-display text-2xl tracking-tighter z-10">{headerTitle}</span>
          )}
          {isEditMode && (
            <button
              onClick={() => { setHeaderPopupDraft(headerTitle); setHeaderPopupImage(headerImage); setShowHeaderPopup(true); }}
              className="absolute top-1 right-1 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover/logo:opacity-100 transition-opacity"
              title="Edit Logo"
            >
              <Edit2 size={10} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex flex-grow overflow-x-auto md:overflow-visible no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/");
            const navClasses = `px-6 py-4 font-display text-xl uppercase tracking-tighter transition-all whitespace-nowrap flex items-center h-full ${isActive
              ? "bg-nasa-blue text-nasa-light-cyan"
              : "text-nasa-gray hover:text-nasa-cyan hover:bg-nasa-blue hover:bg-opacity-50"
              }`;
            const navStyles = {
              borderRight: "2px solid var(--border-color)",
              color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
            };

            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.label} className="relative group flex h-full">
                <Link href={item.href} className={navClasses} style={navStyles}>
                  {item.display}
                </Link>

                {/* Edit button for nav label — shown in edit mode when expanded */}
                {isEditMode && editNavExpanded && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditLabel(item._module); }}
                    className="absolute top-1 right-7 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Label"
                  >
                    <Edit2 size={10} />
                  </button>
                )}
                {isEditMode && editNavExpanded && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteModule(item._module); }}
                    className="absolute top-1 right-1 z-50 p-0.5 bg-black/80 text-red-400 hover:text-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Module"
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                {/* Dropdown — always on hover; edit controls only when expanded */}
                {(hasSubItems || (isEditMode && editNavExpanded)) && (
                  <div
                    className={`absolute left-0 top-full ${isEditMode && editNavExpanded ? "block" : "hidden group-hover:block"} min-w-full bg-nasa-darker z-[100] shadow-lg`}
                    style={{ border: "2px solid var(--border-color-strong)", borderTop: "none" }}
                  >
                    {(item.subItems ?? []).map((sub, idx) => (
                      <div key={sub.href} className="relative group/sub">
                        <Link
                          href={sub.href}
                          className="flex items-center px-6 py-3 font-display text-lg uppercase transition-all whitespace-nowrap text-nasa-gray hover:text-nasa-light-cyan hover:bg-nasa-blue"
                          style={{ borderBottom: "1px solid var(--border-color)" }}
                        >
                          {sub.display}
                          {sub.format && (
                            <span className="ml-2 font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                              {sub.format === "B" ? "B" : "A"}
                            </span>
                          )}
                        </Link>
                        {isEditMode && editNavExpanded && (
                          <div className="absolute top-1 right-1 z-50 flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditSub(item._module, idx); }}
                              className="p-1 bg-black/80 text-cyan-400 hover:text-white rounded"
                              title="Edit"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSub(item._module, idx); }}
                              className="p-1 bg-black/80 text-red-400 hover:text-red-300 rounded"
                              title="Delete"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isEditMode && editNavExpanded && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAddSub(item._module); }}
                        className="flex items-center gap-1 w-full px-6 py-2 font-mono text-xs uppercase text-green-400 hover:text-green-300 hover:bg-nasa-blue/30 transition-all"
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                      >
                        <Plus size={12} /> ADD SUB-ITEM
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new top-level nav module button */}
          {isEditMode && editNavExpanded && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAddModule(); }}
              className="px-4 py-4 flex items-center gap-1 font-mono text-xs uppercase text-green-400 hover:text-green-300 hover:bg-nasa-blue/30 transition-all h-full"
              style={{ borderRight: "2px solid var(--border-color)" }}
              title="Add New Tab"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center gap-3 ml-auto" style={{ borderLeft: "2px solid var(--border-color)", color: "var(--accent-color)" }}>

          {/* Edit Mode Controls */}
          {canEdit && !isEditMode && (
            <button
              onClick={enterEditMode}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all hover:scale-105"
              style={{ border: "1px solid var(--border-color)", color: "var(--accent-color)" }}
              title="Enter Edit Mode"
            >
              <Pencil size={14} /> EDIT
            </button>
          )}

          {isEditMode && (
            <>
              {/* Nav edit collapse toggle */}
              <button
                onClick={() => setEditNavExpanded((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${editNavExpanded ? "bg-cyan-500/20" : ""}`}
                style={{ border: "1px solid var(--border-color)", color: editNavExpanded ? "var(--accent-light)" : "var(--text-secondary)" }}
                title={editNavExpanded ? "Collapse nav editor" : "Expand nav editor"}
              >
                {editNavExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} NAV
              </button>
              <button
                onClick={toggleCanvasMode}
                className={`flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${isCanvasMode ? "bg-cyan-500/20" : ""}`}
                style={{ border: "1px solid var(--border-color)", color: isCanvasMode ? "var(--accent-light)" : "var(--text-secondary)" }}
                title="Toggle Canvas Mode"
              >
                <Move size={12} /> CANVAS
              </button>
              <button
                onClick={() => cancelEdit()}
                className="flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all hover:text-red-400"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
              >
                <X size={12} /> CANCEL
              </button>
              <button
                onClick={applyEdit}
                className="flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all"
                style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)", background: "rgba(0,212,255,0.1)" }}
              >
                <Check size={12} /> APPLY
              </button>
            </>
          )}

          {/* Notification Bell (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="relative text-nasa-gray hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Notification Bell (Editor only) */}
          {isEditor && !isAdmin && (
            <button
              onClick={() => setIsEditorNotificationsOpen(true)}
              className="relative text-nasa-gray hover:text-white transition-colors"
              title="Editor Notifications"
            >
              <Bell size={18} />
              {(unresolvedCount + myPending.filter(p => p.status === "pending").length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unresolvedCount + myPending.filter(p => p.status === "pending").length}
                </span>
              )}
            </button>
          )}

          {/* Settings Gear (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-nasa-gray hover:text-white transition-colors hover:rotate-90 duration-300"
              title="Admin Settings"
            >
              <Settings size={18} />
            </button>
          )}

          {/* Shield Icon (Super Admin only) */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsSuperAdminOpen(true)}
              className="text-nasa-gray hover:text-yellow-400 transition-colors"
              title="Super Admin Panel"
            >
              <Shield size={18} />
            </button>
          )}

          {/* Search Icon */}
          <Search
            size={18}
            className="cursor-pointer hover:scale-110 transition-transform text-nasa-cyan hover:text-nasa-light-cyan"
            onClick={() => setIsSearchOpen(true)}
          />

          {/* Auth — always logged in behind AuthGate */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider hidden md:inline" style={{ color: "var(--text-secondary)" }}>
              {user?.displayName}
            </span>
            <button
              onClick={logout}
              className="text-nasa-gray hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="p-8 max-w-md space-y-4" style={{ background: "var(--bg-secondary)", border: "2px solid var(--border-color-strong)" }}>
            <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>DISCARD CHANGES?</h3>
            <p className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex gap-3">
              <button onClick={confirmCancel} className="nasa-btn text-xs">YES, DISCARD</button>
              <button onClick={denyCancelDialog} className="nasa-btn text-xs" style={{ color: "var(--text-secondary)" }}>NO, KEEP EDITING</button>
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Header Logo Edit Popup */}
      {showHeaderPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 space-y-4 relative" style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)", border: "2px solid var(--border-color-strong)" }}>
            <button onClick={() => setShowHeaderPopup(false)} className="absolute top-3 right-3 text-nasa-gray hover:text-white transition-colors" title="Close"><X size={16} /></button>
            <h3 className="font-display text-xl uppercase" style={{ color: "var(--accent-color)" }}>EDIT HEADER LOGO</h3>

            {/* Image upload area */}
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Logo Image (optional)</label>
              {headerPopupImage ? (
                <div className="flex items-center gap-3">
                  <img src={headerPopupImage} alt="Preview" className="h-10 max-w-[120px] object-contain rounded" style={{ border: "1px solid var(--border-color)" }} />
                  <button onClick={() => setHeaderPopupImage("")} className="text-red-400 hover:text-red-300 font-mono text-[10px] uppercase" title="Remove image">REMOVE</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer font-mono text-xs uppercase hover:bg-white/5 rounded transition-colors" style={{ border: "1px dashed var(--border-color)", color: "var(--text-secondary)" }}>
                  <Upload size={14} /> Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
                    const reader = new FileReader();
                    reader.onload = () => setHeaderPopupImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </label>
              )}
            </div>

            {/* Text input — hidden when image is set */}
            {!headerPopupImage && (
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Text</label>
                <input
                  type="text"
                  value={headerPopupDraft}
                  onChange={(e) => setHeaderPopupDraft(e.target.value)}
                  placeholder="e.g. NASA"
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
            )}

            <button
              onClick={async () => {
                const updates: Record<string, string> = {};
                if (headerPopupImage) {
                  updates.headerImage = headerPopupImage;
                  setHeaderImage(headerPopupImage);
                } else {
                  updates.headerImage = "";
                  updates.headerTitle = headerPopupDraft.trim() || "NASA";
                  setHeaderImage("");
                  setHeaderTitle(headerPopupDraft.trim() || "NASA");
                }
                try { await fetch("/api/site-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) }); } catch { /* ignore */ }
                setShowHeaderPopup(false);
              }}
              className="nasa-btn text-xs w-full"
            >APPLY</button>
          </div>
        </div>
      )}

      <AdminSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <EditorNotificationPanel isOpen={isEditorNotificationsOpen} onClose={() => setIsEditorNotificationsOpen(false)} />
      <SuperAdminPanel isOpen={isSuperAdminOpen} onClose={() => setIsSuperAdminOpen(false)} />

      {/* Nav Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 space-y-4 relative" style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)", border: "2px solid var(--border-color-strong)" }}>
            <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 text-nasa-gray hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>
              {editModal.mode === "edit-label" ? "EDIT NAV LABEL" : editModal.mode === "add-module" ? "ADD NAV TAB" : editModal.mode === "add-sub" ? "ADD SUB-ITEM" : "EDIT SUB-ITEM"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editModal.mode === "edit-label") handleEditLabelSubmit();
                else if (editModal.mode === "add-module") handleAddModuleSubmit();
                else if (editModal.mode === "add-sub") handleAddSubSubmit();
                else handleEditSubSubmit();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  {editModal.mode === "add-module" ? "Tab Name" : editModal.mode === "edit-label" ? "Display Name" : "Sub-item Name"}
                </label>
                <input
                  type="text"
                  value={formDisplay}
                  onChange={(e) => setFormDisplay(e.target.value)}
                  placeholder={editModal.mode === "add-module" ? "e.g. ANALYTICS" : "e.g. RAN REPORT"}
                  required
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>

              {/* Format selector — for new tabs and sub-items */}
              {(editModal.mode === "add-module" || editModal.mode === "add-sub" || editModal.mode === "edit-sub") && (
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Page Format
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "A", label: "FORMAT A", desc: "Card-based content sections" },
                      { value: "B", label: "FORMAT B", desc: "Regional report / slide layout" },
                      { value: "C", label: "FORMAT C", desc: "Know More / documentation layout" },
                      { value: "D", label: "FORMAT D", desc: "Team / directory layout" },
                      { value: "E", label: "FORMAT E", desc: "Drive / file-link layout" },
                      { value: "F", label: "FORMAT F", desc: "Vortex / media gallery layout" },
                    ].map((fmt) => (
                      <label key={fmt.value} className="flex items-center gap-2 cursor-pointer font-mono text-sm p-1.5 rounded transition-colors hover:bg-white/5" style={{ color: formFormat === fmt.value ? "var(--accent-light)" : "var(--text-secondary)" }}>
                        <input type="radio" name="format" value={fmt.value} checked={formFormat === fmt.value} onChange={() => setFormFormat(fmt.value)} className="accent-cyan-400" />
                        {fmt.label}
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>({fmt.desc})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="nasa-btn text-xs">
                {editModal.mode === "edit-label" ? "SAVE" : editModal.mode === "add-module" ? "CREATE TAB" : editModal.mode === "add-sub" ? "ADD" : "SAVE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
