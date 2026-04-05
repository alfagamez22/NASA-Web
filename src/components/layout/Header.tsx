"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Settings, LogOut, Pencil, X, Check, Bell, Move } from "lucide-react";
import { NAV_ITEMS } from "@/data/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEditMode } from "@/lib/edit-mode-context";
import { getNotifications } from "@/lib/data-store";

import SearchModal from "./SearchModal";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";

export default function Header() {
  const pathname = usePathname() ?? "";
  const { user, isAdmin, isEditor, logout } = useAuth();
  const { isEditMode, isCanvasMode, enterEditMode, cancelEdit, applyEdit, toggleCanvasMode, showCancelDialog, confirmCancel, denyCancelDialog } = useEditMode();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const canEdit = isAdmin || isEditor;
  const unreadCount = isAdmin ? getNotifications().filter((n) => !n.read).length : 0;

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
          {NAV_ITEMS.map((item) => {
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

            if (item.subItems && item.subItems.length > 0) {
              return (
                <div key={item.label} className="relative group flex h-full">
                  <Link href={item.href} className={navClasses} style={navStyles}>
                    {item.display}
                  </Link>
                  <div
                    className="absolute left-0 top-full hidden group-hover:block min-w-full bg-nasa-darker z-[100] shadow-lg"
                    style={{ border: "2px solid var(--border-color-strong)", borderTop: "none" }}
                  >
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className="flex items-center px-6 py-3 font-display text-lg uppercase transition-all whitespace-nowrap text-nasa-gray hover:text-nasa-light-cyan hover:bg-nasa-blue"
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                      >
                        {sub.display}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link key={item.label} href={item.href} className={navClasses} style={navStyles}>
                {item.display}
              </Link>
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
    </>
  );
}
