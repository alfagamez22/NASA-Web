"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Trash2, Eye, EyeOff, RotateCcw } from "lucide-react";

interface AuditLog {
  id: string;
  action: "login" | "logout";
  userId: string;
  username: string;
  userRole: string;
  ipAddress?: string;
  createdAt: string;
}

interface SoftDeleteRecord {
  id: string;
  entityType: string;
  entityId: string;
  entityData: any;
  deletedBy: string;
  deletedAt: string;
  purgeAt: string;
  restoredAt?: string;
}

interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminPanel({ isOpen, onClose }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "recycle" | "credentials">("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [softDeletes, setSoftDeletes] = useState<SoftDeleteRecord[]>([]);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Fetch audit logs
  useEffect(() => {
    if (isOpen && activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [isOpen, activeTab]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-log");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  // Fetch soft deletes
  useEffect(() => {
    if (isOpen && activeTab === "recycle") {
      fetchSoftDeletes();
    }
  }, [isOpen, activeTab]);

  const fetchSoftDeletes = async () => {
    try {
      const res = await fetch("/api/soft-deletes");
      if (res.ok) {
        const data = await res.json();
        setSoftDeletes(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch soft deletes:", err);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Are you sure? This will permanently delete all audit logs.")) return;
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/audit-log", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear audit logs");
      }

      const result = await response.json();
      alert("✓ " + result.message);
      
      // Refresh the logs list
      await fetchAuditLogs();
    } catch (error) {
      console.error("Error clearing logs:", error);
      alert("Error: Failed to clear audit logs. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreItem = async (softDeleteId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/soft-deletes?id=${softDeleteId}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Item restored successfully!");
        fetchSoftDeletes();
      } else {
        alert("Failed to restore item");
      }
    } catch (err) {
      console.error("Failed to restore:", err);
      alert("Error restoring item");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermanentlyDelete = async (softDeleteId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/soft-deletes?id=${softDeleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Item permanently deleted!");
        fetchSoftDeletes();
      } else {
        alert("Failed to delete item");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Error deleting item");
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleChangeCredentials = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "superadmin", // Change superadmin credentials
          displayName: newUsername,
          password: newPassword,
        }),
      });

      if (res.ok) {
        alert("Credentials updated successfully!");
        setNewUsername("");
        setNewPassword("");
        setShowPasswordFields(false);
      } else {
        alert("Failed to update credentials");
      }
    } catch (err) {
      console.error("Failed to change credentials:", err);
      alert("Error updating credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDaysUntilPurge = (purgeAt: string) => {
    const now = new Date();
    const purge = new Date(purgeAt);
    const days = Math.ceil((purge.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed right-0 top-0 h-full w-full max-w-2xl flex flex-col"
            style={{ background: "var(--bg-secondary)", borderLeft: "2px solid var(--border-color-strong)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <Shield size={24} style={{ color: "var(--accent-color)" }} />
                <h2 className="font-display text-2xl uppercase tracking-tighter" style={{ color: "var(--accent-color)" }}>
                  SUPER ADMIN
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-nasa-gray hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-color)]">
              {["audit", "recycle", "credentials"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className="flex-1 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all"
                  style={{
                    color: activeTab === tab ? "var(--accent-light)" : "var(--text-secondary)",
                    borderBottom: activeTab === tab ? "2px solid var(--accent-light)" : "none",
                    background: activeTab === tab ? "var(--bg-tertiary)" : "transparent",
                  }}
                >
                  {tab === "audit" ? "Audit Log" : tab === "recycle" ? "Recycle Bin" : "Credentials"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* AUDIT LOG TAB */}
              {activeTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
                      Login/Logout Activity
                    </h3>
                    <button
                      onClick={handleClearLogs}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-3 py-1 text-xs uppercase font-mono transition-all hover:scale-105"
                      style={{
                        border: "1px solid var(--border-color)",
                        color: "var(--accent-color)",
                        opacity: isLoading ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={12} /> Clear Logs
                    </button>
                  </div>

                  {auditLogs.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No audit logs available</p>
                  ) : (
                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded border border-[var(--border-color)]"
                          style={{ background: "var(--bg-tertiary)" }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-mono text-sm uppercase" style={{ color: "var(--accent-light)" }}>
                                {log.action === "login" ? "🔓 LOGIN" : "🔒 LOGOUT"}
                              </p>
                              <p style={{ color: "var(--text-primary)" }}>
                                <strong>{log.username}</strong> ({log.userRole})
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {log.ipAddress && `IP: ${log.ipAddress}`}
                              </p>
                            </div>
                            <time className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {formatDate(log.createdAt)}
                            </time>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RECYCLE BIN TAB */}
              {activeTab === "recycle" && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
                    Recoverable Items (30-Day Rollback)
                  </h3>

                  {softDeletes.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No deleted items in recycle bin</p>
                  ) : (
                    <div className="space-y-3">
                      {softDeletes.map((item) => {
                        const daysLeft = getDaysUntilPurge(item.purgeAt);
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded border border-[var(--border-color)]"
                            style={{ background: "var(--bg-tertiary)" }}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <p className="font-mono text-sm uppercase mb-1" style={{ color: "var(--accent-light)" }}>
                                  {item.entityType}
                                </p>
                                <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                                  Deleted by: <strong>{item.deletedBy}</strong>
                                </p>
                                <time className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {formatDate(item.deletedAt)}
                                </time>
                                <div className="text-xs mt-2 px-2 py-1 rounded" style={{ background: daysLeft > 10 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: daysLeft > 10 ? "#22c55e" : "#ef4444" }}>
                                  {daysLeft} days until permanent deletion
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleRestoreItem(item.id)}
                                  disabled={isLoading}
                                  className="p-2 rounded hover:bg-green-600/20 transition-colors"
                                  title="Restore"
                                >
                                  <RotateCcw size={14} className="text-green-400" />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(item.id)}
                                  disabled={isLoading || confirmDelete === item.id}
                                  className="p-2 rounded hover:bg-red-600/20 transition-colors"
                                  title="Permanently Delete"
                                >
                                  <Trash2 size={14} className="text-red-400" />
                                </button>
                              </div>
                            </div>

                            {confirmDelete === item.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 rounded border border-red-600/30 bg-red-600/10"
                              >
                                <p className="text-xs text-red-400 mb-2">Permanently delete? This cannot be undone.</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handlePermanentlyDelete(item.id)}
                                    disabled={isLoading}
                                    className="text-xs px-2 py-1 rounded bg-red-600/50 hover:bg-red-600/70 transition-colors"
                                  >
                                    YES, DELETE
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="text-xs px-2 py-1 rounded bg-gray-600/30 hover:bg-gray-600/50 transition-colors"
                                  >
                                    CANCEL
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CREDENTIALS TAB */}
              {activeTab === "credentials" && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
                    Superadmin Credentials
                  </h3>
                  <p style={{ color: "var(--text-secondary)" }} className="text-sm">
                    Change the superadmin account credentials. This affects all super admin access to this system.
                  </p>

                  <div className="space-y-3 mt-6">
                    <div>
                      <label className="font-mono text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                        Current Username
                      </label>
                      <div className="px-3 py-2 rounded bg-black/30 border border-[var(--border-color)]">
                        <p className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>superadmin</p>
                      </div>
                    </div>

                    {showPasswordFields ? (
                      <>
                        <div>
                          <label className="font-mono text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                            New Username
                          </label>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="new username"
                            className="w-full px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                            style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="font-mono text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="new password"
                            className="w-full px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                            style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleChangeCredentials}
                            disabled={isLoading || !newUsername.trim() || !newPassword.trim()}
                            className="px-3 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
                            style={{
                              border: "1px solid var(--accent-color)",
                              color: "var(--accent-color)",
                              opacity: isLoading || !newUsername.trim() || !newPassword.trim() ? 0.5 : 1,
                            }}
                          >
                            CONFIRM CHANGE
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordFields(false);
                              setNewUsername("");
                              setNewPassword("");
                            }}
                            className="px-3 py-2 rounded text-xs uppercase font-mono bg-gray-600/30 hover:bg-gray-600/50 transition-colors"
                          >
                            CANCEL
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowPasswordFields(true)}
                        className="w-full px-3 py-2 rounded border border-[var(--border-color)] text-xs uppercase font-mono transition-all hover:bg-nasa-blue/30"
                        style={{ color: "var(--accent-color)" }}
                      >
                        CHANGE CREDENTIALS
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
