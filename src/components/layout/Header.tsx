"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Settings, LogOut, Pencil, X, Check, Bell, Move, Edit2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEditMode } from "@/lib/edit-mode-context";
import { getNotifications } from "@/lib/data-store";

import SearchModal from "./SearchModal";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";

interface SubNavItem { display: string; href: string; format?: string }
interface ModuleData { id: string; slug: string; display: string; href: string; subNav?: SubNavItem[] | null }

export default function Header() {
  const pathname = usePathname() ?? "";
  const { user, isAdmin, isEditor, logout } = useAuth();
  const { isEditMode, isCanvasMode, enterEditMode, cancelEdit, applyEdit, toggleCanvasMode, showCancelDialog, confirmCancel, denyCancelDialog } = useEditMode();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    mode: "edit-label" | "add-sub" | "edit-sub";
    module: ModuleData;
    subIdx?: number;
  } | null>(null);
  const [formDisplay, setFormDisplay] = useState("");
  const [formFormat, setFormFormat] = useState<"A" | "B">("A");

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
    setFormFormat(sub?.format === "B" ? "B" : "A");
    setEditModal({ mode: "edit-sub", module: mod, subIdx: idx });
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
    if (!editModal || !formDisplay.trim()) return;
    saveModule(editModal.module.id, { display: formDisplay.trim() });
    setEditModal(null);
  }

  function handleAddSubSubmit() {
    if (!editModal || !formDisplay.trim()) return;
    const mod = editModal.module;
    const existing = mod.subNav ?? [];
    const slug = formDisplay.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const parentHref = mod.href === "/" ? "" : mod.href;
    const newSub: SubNavItem = { display: formDisplay.trim().toUpperCase(), href: `${parentHref}/${slug}`, format: formFormat };
    saveModule(mod.id, { subNav: [...existing, newSub] });
    setEditModal(null);
  }

  function handleEditSubSubmit() {
    if (!editModal || editModal.subIdx === undefined || !formDisplay.trim()) return;
    const mod = editModal.module;
    const subs = [...(mod.subNav ?? [])];
    subs[editModal.subIdx] = { ...subs[editModal.subIdx], display: formDisplay.trim().toUpperCase(), format: formFormat };
    saveModule(mod.id, { subNav: subs });
    setEditModal(null);
  }

  async function handleDeleteSub(mod: ModuleData, idx: number) {
    const sub = (mod.subNav ?? [])[idx];
    if (!confirm(`Delete "${sub.display}"?`)) return;
    const subs = [...(mod.subNav ?? [])];
    subs.splice(idx, 1);
    saveModule(mod.id, { subNav: subs });
  }

  const canEdit = isAdmin || isEditor;
  const unreadCount = isAdmin ? getNotifications().filter((n) => !n.read).length : 0;

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
        <div className="p-4 flex items-center gap-3 bg-nasa-blue text-nasa-light-cyan z-50 overflow-visible" style={{ borderRight: "2px solid var(--border-color-strong)", background: "linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))", color: "var(--accent-light)" }}>
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            <Image src="/broadcast.gif" alt="SCC RAN Logo" width={54} height={54} unoptimized className="absolute max-w-none object-contain" />
          </div>
          <span className="font-display text-2xl tracking-tighter z-10">NASA</span>
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

                {/* Edit button for nav label — shown in edit mode */}
                {isEditMode && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditLabel(item._module); }}
                    className="absolute top-1 right-1 z-50 p-0.5 bg-black/80 text-cyan-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit Label"
                  >
                    <Edit2 size={10} />
                  </button>
                )}

                {/* Dropdown — visible on hover OR in edit mode */}
                {(hasSubItems || isEditMode) && (
                  <div
                    className={`absolute left-0 top-full ${isEditMode ? "block" : "hidden group-hover:block"} min-w-full bg-nasa-darker z-[100] shadow-lg`}
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
                        {isEditMode && (
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
                    {isEditMode && (
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
      <AdminSettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Nav Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 space-y-4 relative" style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)", border: "2px solid var(--border-color-strong)" }}>
            <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 text-nasa-gray hover:text-white transition-colors">
              <X size={18} />
            </button>
            <h3 className="font-display text-2xl uppercase" style={{ color: "var(--accent-color)" }}>
              {editModal.mode === "edit-label" ? "EDIT NAV LABEL" : editModal.mode === "add-sub" ? "ADD SUB-ITEM" : "EDIT SUB-ITEM"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editModal.mode === "edit-label") handleEditLabelSubmit();
                else if (editModal.mode === "add-sub") handleAddSubSubmit();
                else handleEditSubSubmit();
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  {editModal.mode === "edit-label" ? "Display Name" : "Sub-item Name"}
                </label>
                <input
                  type="text"
                  value={formDisplay}
                  onChange={(e) => setFormDisplay(e.target.value)}
                  placeholder="e.g. RAN REPORT"
                  required
                  className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  autoFocus
                />
              </div>

              {/* Format selector — only for sub-items */}
              {editModal.mode !== "edit-label" && (
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Page Format
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-sm" style={{ color: formFormat === "A" ? "var(--accent-light)" : "var(--text-secondary)" }}>
                      <input type="radio" name="format" value="A" checked={formFormat === "A"} onChange={() => setFormFormat("A")} className="accent-cyan-400" />
                      FORMAT A
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>(RAN Report layout)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-sm" style={{ color: formFormat === "B" ? "var(--accent-light)" : "var(--text-secondary)" }}>
                      <input type="radio" name="format" value="B" checked={formFormat === "B"} onChange={() => setFormFormat("B")} className="accent-cyan-400" />
                      FORMAT B
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>(Regional Report layout)</span>
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="nasa-btn text-xs">
                {editModal.mode === "edit-label" ? "SAVE" : editModal.mode === "add-sub" ? "ADD" : "SAVE"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
