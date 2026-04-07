"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

export interface RecentChange {
  id: string;
  entityRef: string;
  changeType: string;
  itemName: string;
  username: string;
  createdAt: string;
}

export interface HighlightSettings {
  enabled: boolean;
  color: string;
  durationHours: number;
}

const DEFAULT_SETTINGS: HighlightSettings = {
  enabled: true,
  color: "#22c55e", // green-500
  durationHours: 24,
};

const SETTINGS_KEY = "nasa-highlight-settings";

interface HighlightContextType {
  /** Recent changes with entity refs for highlighting */
  recentChanges: RecentChange[];
  /** Check if an entity was recently changed */
  isRecentlyChanged: (entityRef: string) => boolean;
  /** Get the change details for an entity */
  getChangeInfo: (entityRef: string) => RecentChange | undefined;
  /** Admin highlight settings */
  settings: HighlightSettings;
  /** Update highlight settings (persists to localStorage) */
  updateSettings: (patch: Partial<HighlightSettings>) => void;
  /** Refresh recent changes from server */
  refresh: () => void;
}

const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

function loadSettings(): HighlightSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: HighlightSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function HighlightProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isEditor } = useAuth();
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [settings, setSettings] = useState<HighlightSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    // Only fetch if user is editor, admin, or super_admin
    if (!isEditor && !isAdmin) return;
    try {
      const res = await fetch(`/api/activity-log?recent=true&hours=${settings.durationHours}`);
      if (res.ok) {
        const data: RecentChange[] = await res.json();
        setRecentChanges(data);
      }
    } catch { /* ignore */ }
  }, [user, isEditor, isAdmin, settings.durationHours]);

  useEffect(() => {
    refresh();
    // Poll every 30 seconds
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  const isRecentlyChanged = useCallback(
    (entityRef: string): boolean => {
      if (!settings.enabled) return false;
      return recentChanges.some((c) => c.entityRef === entityRef);
    },
    [recentChanges, settings.enabled]
  );

  const getChangeInfo = useCallback(
    (entityRef: string): RecentChange | undefined => {
      return recentChanges.find((c) => c.entityRef === entityRef);
    },
    [recentChanges]
  );

  const updateSettings = useCallback((patch: Partial<HighlightSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <HighlightContext.Provider value={{ recentChanges, isRecentlyChanged, getChangeInfo, settings, updateSettings, refresh }}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  const context = useContext(HighlightContext);
  if (context === undefined) {
    throw new Error("useHighlight must be used within a HighlightProvider");
  }
  return context;
}
