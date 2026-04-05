"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

interface EditModeContextType {
  isEditMode: boolean;
  isCanvasMode: boolean;
  pendingChanges: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
  cancelEdit: () => boolean; // returns true if user confirms
  applyEdit: () => void;
  toggleCanvasMode: () => void;
  markChanged: () => void;
  showCancelDialog: boolean;
  setShowCancelDialog: (v: boolean) => void;
  confirmCancel: () => void;
  denyCancelDialog: () => void;
  notifyChange: (page: string, changeType: "add" | "edit" | "delete", itemName: string) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isEditor } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [onCancelConfirm, setOnCancelConfirm] = useState<(() => void) | null>(null);

  const canEdit = isAdmin || isEditor;

  const enterEditMode = useCallback(() => {
    if (!canEdit) return;
    setIsEditMode(true);
    setPendingChanges(false);
  }, [canEdit]);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setIsCanvasMode(false);
    setPendingChanges(false);
  }, []);

  const cancelEdit = useCallback((): boolean => {
    if (pendingChanges) {
      setShowCancelDialog(true);
      return false;
    }
    exitEditMode();
    return true;
  }, [pendingChanges, exitEditMode]);

  const confirmCancel = useCallback(() => {
    setShowCancelDialog(false);
    exitEditMode();
  }, [exitEditMode]);

  const denyCancelDialog = useCallback(() => {
    setShowCancelDialog(false);
  }, []);

  const applyEdit = useCallback(() => {
    // If editor (not admin), this triggers notification
    setPendingChanges(false);
    exitEditMode();
  }, [exitEditMode]);

  const toggleCanvasMode = useCallback(() => {
    setIsCanvasMode((prev) => !prev);
  }, []);

  const markChanged = useCallback(() => {
    setPendingChanges(true);
  }, []);

  const notifyChange = useCallback(
    (page: string, changeType: "add" | "edit" | "delete", itemName: string) => {
      if (user && isEditor && !isAdmin) {
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, changeType, itemName }),
        }).catch(() => {});
      }
    },
    [user, isEditor, isAdmin]
  );

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        isCanvasMode,
        pendingChanges,
        enterEditMode,
        exitEditMode,
        cancelEdit,
        applyEdit,
        toggleCanvasMode,
        markChanged,
        showCancelDialog,
        setShowCancelDialog,
        confirmCancel,
        denyCancelDialog,
        notifyChange,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error("useEditMode must be used within an EditModeProvider");
  }
  return context;
}
