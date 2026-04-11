"use client";

import { motion } from "framer-motion";
import { X, Check, AlertCircle, Clock } from "lucide-react";
import { usePendingChanges } from "@/shared/contexts/pending-context";
import type { EditorPending } from "@/shared/contexts/pending-context";

interface EditorNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditorNotificationPanel({ isOpen, onClose }: EditorNotificationPanelProps) {
  const { resolved, myPending, markResolvedSeen } = usePendingChanges();

  if (!isOpen) return null;

  const pending = myPending.filter((p) => p.status === "pending");
  const approved = resolved.filter((r) => r.status === "approved");
  const declined = resolved.filter((r) => r.status === "declined");

  const handleClose = () => {
    markResolvedSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-end bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm h-screen overflow-y-auto flex flex-col"
        style={{
          background: "linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary))",
          borderLeft: "2px solid var(--border-color-strong)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="font-display text-2xl uppercase" style={{ textShadow: "0 0 10px var(--glow-color)", color: "var(--accent-color)" }}>
            NOTIFICATIONS
          </h2>
          <button
            onClick={handleClose}
            className="text-nasa-gray hover:text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-8">
          {/* Pending — awaiting admin review */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <h3 className="font-mono text-sm uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
                  AWAITING APPROVAL ({pending.length})
                </h3>
              </div>
              <div className="space-y-2">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-sm text-sm"
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <div className="font-mono text-xs uppercase tracking-wider text-amber-400">
                      {item.changeType}
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>{item.itemName}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()} — Pending review
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                <h3 className="font-mono text-sm uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
                  APPROVED ({approved.length})
                </h3>
              </div>
              <div className="space-y-2">
                {approved.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-sm text-sm"
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                    }}
                  >
                    <div className="font-mono text-xs uppercase tracking-wider text-green-400">
                      {item.changeType}
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>{item.itemName}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declined */}
          {declined.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <h3 className="font-mono text-sm uppercase tracking-wider" style={{ color: "var(--accent-light)" }}>
                  DECLINED ({declined.length})
                </h3>
              </div>
              <div className="space-y-2">
                {declined.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-sm text-sm"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <div className="font-mono text-xs uppercase tracking-wider text-red-400">
                      {item.changeType}
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>{item.itemName}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {pending.length === 0 && resolved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div style={{ color: "var(--text-secondary)" }} className="font-mono text-xs uppercase tracking-wider mb-2">
                NO NOTIFICATIONS
              </div>
              <div style={{ color: "var(--text-secondary)" }} className="text-sm">
                Your change requests will appear here when the admin responds.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
