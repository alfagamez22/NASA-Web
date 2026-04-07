"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

export interface EditorPending {
  id: string;
  page: string;
  changeType: string;
  itemName: string;
  status: "pending" | "approved" | "declined";
  entityRef: string | null;
  createdAt: string;
}

interface PendingContextType {
  /** Pending changes for the current editor */
  myPending: EditorPending[];
  /** Check if an entity has a pending change (by entityRef pattern match) */
  isPending: (entityRef: string) => boolean;
  /** Recently approved/declined items (for editor notification) */
  resolved: EditorPending[];
  /** Unread resolved count */
  unresolvedCount: number;
  /** Mark all resolved as seen */
  markResolvedSeen: () => void;
  /** Refresh from server */
  refresh: () => void;
}

const PendingContext = createContext<PendingContextType | undefined>(undefined);

export function PendingChangesProvider({ children }: { children: ReactNode }) {
  const { user, isEditor, isAdmin } = useAuth();
  const [myPending, setMyPending] = useState<EditorPending[]>([]);
  const [resolved, setResolved] = useState<EditorPending[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user || (!isEditor && !isAdmin)) return;
    try {
      // Fetch pending changes the editor can see
      const [pendRes, allRes] = await Promise.all([
        fetch("/api/pending-changes?status=pending"),
        fetch("/api/pending-changes?status=all"),
      ]);
      if (pendRes.ok) {
        const data = await pendRes.json();
        // If editor, show only their own
        if (isEditor && !isAdmin) {
          setMyPending(data.filter((c: EditorPending) => c.id));
        }
      }
      if (allRes.ok) {
        const allData: EditorPending[] = await allRes.json();
        // Show approved/declined to the editor who submitted them
        if (isEditor && !isAdmin && user) {
          setResolved(allData.filter((c) => (c.status === "approved" || c.status === "declined")));
        }
      }
    } catch { /* ignore */ }
  }, [user, isEditor, isAdmin]);

  useEffect(() => {
    refresh();
    // Poll every 30s
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  const isPending = useCallback(
    (entityRef: string): boolean => {
      return myPending.some((p) => p.entityRef === entityRef);
    },
    [myPending]
  );

  const unresolvedCount = resolved.filter((r) => !seenIds.has(r.id)).length;

  const markResolvedSeen = useCallback(() => {
    setSeenIds(new Set(resolved.map((r) => r.id)));
  }, [resolved]);

  return (
    <PendingContext.Provider value={{ myPending, isPending, resolved, unresolvedCount, markResolvedSeen, refresh }}>
      {children}
    </PendingContext.Provider>
  );
}

export function usePendingChanges() {
  const context = useContext(PendingContext);
  if (context === undefined) {
    throw new Error("usePendingChanges must be used within a PendingChangesProvider");
  }
  return context;
}
