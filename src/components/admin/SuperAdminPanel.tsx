"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Trash2, Eye, EyeOff, RotateCcw, Users, Activity, Ban, UserPlus, Database, Play, Save, Loader2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";

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

interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  email?: string | null;
  emailVerified?: boolean;
  suspended?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface SystemLog {
  id: string;
  actorId: string;
  actionType: string;
  targetId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actor: { username: string; displayName: string; role: string };
  target?: { username: string; displayName: string; role: string } | null;
}

interface SuperAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminPanel({ isOpen, onClose }: SuperAdminPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"accounts" | "activity" | "audit" | "recycle" | "credentials" | "database">("accounts");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [softDeletes, setSoftDeletes] = useState<SoftDeleteRecord[]>([]);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Account management state
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", displayName: "", password: "", email: "", role: "editor" });
  const [createError, setCreateError] = useState("");

  // Activity log state
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityFilter, setActivityFilter] = useState("");

  // Suspension state
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);

  // Database management state
  const [dbSQL, setDbSQL] = useState("");
  const [dbResult, setDbResult] = useState<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number; truncated: boolean } | null>(null);
  const [dbError, setDbError] = useState("");
  const [dbRunning, setDbRunning] = useState(false);
  const [savedQueries, setSavedQueries] = useState<{ id: string; name: string; queryText: string; createdAt: string; user?: { username: string } }[]>([]);
  const [saveQueryName, setSaveQueryName] = useState("");
  const [showSaved, setShowSaved] = useState(false);

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
        setAuditLogs(Array.isArray(data) ? data : []);
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
        setSoftDeletes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch soft deletes:", err);
    }
  };

  // Fetch all users (accounts tab)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setAllUsers(await res.json());
    } catch (err) { console.error("Failed to fetch users:", err); }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "accounts") fetchUsers();
  }, [isOpen, activeTab, fetchUsers]);

  // Fetch system activity logs
  const fetchSystemLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(activityPage), limit: "50" });
      if (activityFilter) params.set("actionType", activityFilter);
      const res = await fetch(`/api/activity-log/system?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data.logs ?? []);
        setActivityTotal(data.total ?? 0);
      }
    } catch (err) { console.error("Failed to fetch system logs:", err); }
  }, [activityPage, activityFilter]);

  useEffect(() => {
    if (isOpen && activeTab === "activity") fetchSystemLogs();
  }, [isOpen, activeTab, fetchSystemLogs]);

  // Create user handler
  const handleCreateUser = async () => {
    setCreateError("");
    if (!createForm.username || !createForm.password || !createForm.displayName) {
      setCreateError("Username, display name, and password are required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateUser(false);
        setCreateForm({ username: "", displayName: "", password: "", email: "", role: "editor" });
        fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        setCreateError(err.error || "Failed to create user");
      }
    } catch { setCreateError("Network error"); } finally { setIsLoading(false); }
  };

  // Suspend/unsuspend handler
  const handleSuspension = async (userId: string, action: "suspend" | "unsuspend") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users/suspension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason: suspendReason }),
      });
      if (res.ok) {
        fetchUsers();
        setSuspendingUserId(null);
        setSuspendReason("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Failed to ${action} user`);
      }
    } catch { alert("Network error"); } finally { setIsLoading(false); }
  };

  // Database management functions
  const fetchSavedQueries = useCallback(async () => {
    try {
      const res = await fetch("/api/db-manager");
      if (res.ok) setSavedQueries(await res.json());
    } catch (err) { console.error("Failed to fetch saved queries:", err); }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "database") fetchSavedQueries();
  }, [isOpen, activeTab, fetchSavedQueries]);

  const handleRunQuery = async () => {
    if (!dbSQL.trim()) return;
    setDbRunning(true);
    setDbError("");
    setDbResult(null);
    try {
      const res = await fetch("/api/db-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", sql: dbSQL }),
      });
      const data = await res.json();
      if (res.ok) {
        setDbResult(data);
      } else {
        setDbError(data.error || "Query failed");
      }
    } catch { setDbError("Network error"); } finally { setDbRunning(false); }
  };

  const handleSaveQuery = async () => {
    if (!dbSQL.trim() || !saveQueryName.trim()) return;
    try {
      const res = await fetch("/api/db-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", sql: dbSQL, name: saveQueryName }),
      });
      if (res.ok) {
        setSaveQueryName("");
        fetchSavedQueries();
      }
    } catch { console.error("Failed to save query"); }
  };

  const handleDeleteSavedQuery = async (id: string) => {
    try {
      await fetch("/api/db-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      fetchSavedQueries();
    } catch { console.error("Failed to delete query"); }
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

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Delete this audit log entry permanently?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/audit-log?id=${encodeURIComponent(logId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete audit log");
      }

      await fetchAuditLogs();
    } catch (error) {
      console.error("Error deleting audit log:", error);
      alert("Error: Failed to delete audit log entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreItem = async (softDeleteId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/soft-deletes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: softDeleteId }),
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
    if (!newUsername.trim() && !newPassword.trim()) {
      alert("Please enter a new username or password");
      return;
    }

    try {
      setIsLoading(true);
      // Use the logged-in super admin's own session ID
      if (!user) { alert("Not logged in"); return; }

      const body: Record<string, string> = { id: user.id };
      if (newUsername.trim()) body.username = newUsername.trim();
      if (newPassword.trim()) body.password = newPassword.trim();

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Credentials updated successfully!");
        setNewUsername("");
        setNewPassword("");
        setShowPasswordFields(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update credentials");
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
            <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
              {([
                { key: "accounts", label: "Accounts", icon: Users },
                { key: "activity", label: "Activity", icon: Activity },
                { key: "audit", label: "Audit Log", icon: Eye },
                { key: "recycle", label: "Recycle Bin", icon: Trash2 },
                { key: "credentials", label: "Credentials", icon: Shield },
                { key: "database", label: "Database", icon: Database },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 font-mono text-xs uppercase tracking-wider transition-all whitespace-nowrap"
                  style={{
                    color: activeTab === key ? "var(--accent-light)" : "var(--text-secondary)",
                    borderBottom: activeTab === key ? "2px solid var(--accent-light)" : "none",
                    background: activeTab === key ? "var(--bg-tertiary)" : "transparent",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ACCOUNTS TAB */}
              {activeTab === "accounts" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
                      User Accounts
                    </h3>
                    <button
                      onClick={() => setShowCreateUser(!showCreateUser)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase font-mono transition-all hover:scale-105"
                      style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}
                    >
                      <UserPlus size={14} /> New User
                    </button>
                  </div>

                  {/* Create User Form */}
                  <AnimatePresence>
                    {showCreateUser && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded border border-[var(--border-color)] space-y-3 mb-4" style={{ background: "var(--bg-tertiary)" }}>
                          <h4 className="font-mono text-sm uppercase" style={{ color: "var(--accent-light)" }}>Create Account</h4>
                          {createError && (
                            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded">{createError}</p>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Username *"
                              value={createForm.username}
                              onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))}
                              className="px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            />
                            <input
                              type="text"
                              placeholder="Display Name *"
                              value={createForm.displayName}
                              onChange={(e) => setCreateForm(f => ({ ...f, displayName: e.target.value }))}
                              className="px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            />
                            <input
                              type="password"
                              placeholder="Password *"
                              value={createForm.password}
                              onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                              className="px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            />
                            <input
                              type="email"
                              placeholder="Email (optional)"
                              value={createForm.email}
                              onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                              className="px-3 py-2 rounded bg-transparent outline-none font-mono text-sm"
                              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>Role:</label>
                            <select
                              value={createForm.role}
                              onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                              className="px-3 py-1.5 rounded outline-none font-mono text-sm cursor-pointer"
                              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-card, #0a1428)" }}
                            >
                              <option value="viewer" style={{ background: "#0a1428", color: "var(--text-primary)" }}>Viewer</option>
                              <option value="editor" style={{ background: "#0a1428", color: "var(--text-primary)" }}>Editor</option>
                              <option value="admin" style={{ background: "#0a1428", color: "var(--text-primary)" }}>Admin</option>
                              <option value="super_admin" style={{ background: "#0a1428", color: "var(--text-primary)" }}>Super Admin</option>
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleCreateUser}
                              disabled={isLoading}
                              className="px-4 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
                              style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)", opacity: isLoading ? 0.5 : 1 }}
                            >
                              {isLoading ? "Creating..." : "Create Account"}
                            </button>
                            <button
                              onClick={() => { setShowCreateUser(false); setCreateError(""); }}
                              className="px-4 py-2 rounded text-xs uppercase font-mono bg-gray-600/30 hover:bg-gray-600/50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User List */}
                  {allUsers.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No users found</p>
                  ) : (
                    <div className="space-y-2">
                      {allUsers.map((u) => (
                        <div
                          key={u.id}
                          className="p-3 rounded border border-[var(--border-color)]"
                          style={{ background: u.suspended ? "rgba(239,68,68,0.05)" : "var(--bg-tertiary)" }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                  {u.displayName}
                                </span>
                                <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                                  @{u.username}
                                </span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono"
                                  style={{
                                    background: u.role === "super_admin" ? "rgba(147,51,234,0.2)" : u.role === "admin" ? "rgba(59,130,246,0.2)" : u.role === "editor" ? "rgba(34,197,94,0.2)" : "rgba(107,114,128,0.2)",
                                    color: u.role === "super_admin" ? "#a78bfa" : u.role === "admin" ? "#60a5fa" : u.role === "editor" ? "#4ade80" : "#9ca3af",
                                  }}
                                >
                                  {u.role}
                                </span>
                                {u.suspended && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-red-500/20 text-red-400">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                                {u.email && (
                                  <span>
                                    {u.email} {u.emailVerified ? "✓" : "✗"}
                                  </span>
                                )}
                                {u.lastLoginAt && (
                                  <span>Last login: {formatDate(u.lastLoginAt)}</span>
                                )}
                              </div>
                            </div>

                            {/* Suspend / Unsuspend */}
                            <div className="flex gap-1 shrink-0">
                              {suspendingUserId === u.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Reason"
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    className="px-2 py-1 rounded bg-transparent outline-none font-mono text-xs w-32"
                                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                                  />
                                  <button
                                    onClick={() => handleSuspension(u.id, u.suspended ? "unsuspend" : "suspend")}
                                    disabled={isLoading}
                                    className="px-2 py-1 text-[10px] uppercase font-mono rounded"
                                    style={{ border: "1px solid", borderColor: u.suspended ? "#22c55e" : "#ef4444", color: u.suspended ? "#22c55e" : "#ef4444" }}
                                  >
                                    {u.suspended ? "Unsuspend" : "Suspend"}
                                  </button>
                                  <button
                                    onClick={() => { setSuspendingUserId(null); setSuspendReason(""); }}
                                    className="px-2 py-1 text-[10px] font-mono rounded bg-gray-600/30"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSuspendingUserId(u.id)}
                                  className="p-1.5 rounded transition-colors"
                                  style={{ color: u.suspended ? "#22c55e" : "#f87171" }}
                                  title={u.suspended ? "Unsuspend user" : "Suspend user"}
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
                      System Activity
                    </h3>
                    <select
                      value={activityFilter}
                      onChange={(e) => { setActivityFilter(e.target.value); setActivityPage(1); }}
                      className="px-2 py-1 rounded outline-none font-mono text-xs cursor-pointer"
                      style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-card, #0a1428)" }}
                    >
                      <option value="" style={{ background: "#0a1428" }}>All Actions</option>
                      <option value="user_created" style={{ background: "#0a1428" }}>User Created</option>
                      <option value="user_updated" style={{ background: "#0a1428" }}>User Updated</option>
                      <option value="user_deleted" style={{ background: "#0a1428" }}>User Deleted</option>
                      <option value="user_suspended" style={{ background: "#0a1428" }}>User Suspended</option>
                      <option value="user_unsuspended" style={{ background: "#0a1428" }}>User Unsuspended</option>
                      <option value="login_success" style={{ background: "#0a1428" }}>Login Success</option>
                      <option value="login_failed" style={{ background: "#0a1428" }}>Login Failed</option>
                      <option value="password_changed" style={{ background: "#0a1428" }}>Password Changed</option>
                      <option value="password_reset" style={{ background: "#0a1428" }}>Password Reset</option>
                      <option value="email_verified" style={{ background: "#0a1428" }}>Email Verified</option>
                      <option value="otp_sent" style={{ background: "#0a1428" }}>OTP Sent</option>
                      <option value="role_changed" style={{ background: "#0a1428" }}>Role Changed</option>
                    </select>
                  </div>

                  {systemLogs.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No activity logs found</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {systemLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded border border-[var(--border-color)]"
                            style={{ background: "var(--bg-tertiary)" }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-mono mb-1"
                                  style={{
                                    background: log.actionType.includes("suspend") ? "rgba(239,68,68,0.2)" :
                                      log.actionType.includes("created") ? "rgba(34,197,94,0.2)" :
                                      log.actionType.includes("login") ? "rgba(59,130,246,0.2)" :
                                      "rgba(107,114,128,0.2)",
                                    color: log.actionType.includes("suspend") ? "#f87171" :
                                      log.actionType.includes("created") ? "#4ade80" :
                                      log.actionType.includes("login") ? "#60a5fa" :
                                      "#9ca3af",
                                  }}
                                >
                                  {log.actionType.replace(/_/g, " ")}
                                </span>
                                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                                  <strong>{log.actor?.username ?? "system"}</strong>
                                  {log.target && (
                                    <> → <strong>{log.target.username}</strong></>
                                  )}
                                </p>
                                {log.metadata && (
                                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                    {typeof log.metadata === "object"
                                      ? Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(" | ")
                                      : String(log.metadata)}
                                  </p>
                                )}
                              </div>
                              <time className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                                {formatDate(log.createdAt)}
                              </time>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {activityTotal > 50 && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                            Page {activityPage} of {Math.ceil(activityTotal / 50)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              disabled={activityPage <= 1}
                              onClick={() => setActivityPage(p => p - 1)}
                              className="px-3 py-1 text-xs font-mono rounded border border-[var(--border-color)] disabled:opacity-30"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Prev
                            </button>
                            <button
                              disabled={activityPage >= Math.ceil(activityTotal / 50)}
                              onClick={() => setActivityPage(p => p + 1)}
                              className="px-3 py-1 text-xs font-mono rounded border border-[var(--border-color)] disabled:opacity-30"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

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
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <time className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {formatDate(log.createdAt)}
                              </time>
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-mono rounded transition-colors"
                                style={{
                                  border: "1px solid rgba(239,68,68,0.5)",
                                  color: "#f87171",
                                  opacity: isLoading ? 0.5 : 1,
                                }}
                                title="Delete this log entry"
                              >
                                <Trash2 size={10} /> Delete
                              </button>
                            </div>
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
                            disabled={isLoading || (!newUsername.trim() && !newPassword.trim())}
                            className="px-3 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
                            style={{
                              border: "1px solid var(--accent-color)",
                              color: "var(--accent-color)",
                              opacity: isLoading || (!newUsername.trim() && !newPassword.trim()) ? 0.5 : 1,
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

                  {/* 2FA Section */}
                  <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                    <TwoFactorSetup />
                  </div>
                </div>
              )}

              {/* Database Tab */}
              {activeTab === "database" && (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  {/* SQL Editor */}
                  <div>
                    <label className="font-mono text-xs uppercase tracking-wider mb-2 block" style={{ color: "var(--text-secondary)" }}>
                      SQL Query <span className="normal-case text-[10px]">(read-only — SELECT, EXPLAIN, SHOW)</span>
                    </label>
                    <textarea
                      value={dbSQL}
                      onChange={(e) => setDbSQL(e.target.value)}
                      placeholder="SELECT * FROM users LIMIT 10;"
                      rows={5}
                      className="w-full px-3 py-2 rounded bg-transparent outline-none font-mono text-sm resize-y"
                      style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", minHeight: "80px" }}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleRunQuery(); }}
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        onClick={handleRunQuery}
                        disabled={dbRunning || !dbSQL.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase font-mono transition-all hover:scale-105"
                        style={{
                          border: "1px solid var(--accent-color)",
                          color: "var(--accent-color)",
                          opacity: dbRunning || !dbSQL.trim() ? 0.5 : 1,
                        }}
                      >
                        {dbRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        {dbRunning ? "Running..." : "Run (Ctrl+Enter)"}
                      </button>

                      {/* Save query */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={saveQueryName}
                          onChange={(e) => setSaveQueryName(e.target.value)}
                          placeholder="Query name..."
                          className="px-2 py-1.5 rounded bg-transparent outline-none font-mono text-xs"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", width: "140px" }}
                        />
                        <button
                          onClick={handleSaveQuery}
                          disabled={!dbSQL.trim() || !saveQueryName.trim()}
                          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs uppercase font-mono transition-all hover:bg-nasa-blue/30"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)", opacity: !dbSQL.trim() || !saveQueryName.trim() ? 0.4 : 1 }}
                        >
                          <Save size={12} /> Save
                        </button>
                      </div>

                      {/* Toggle saved queries */}
                      <button
                        onClick={() => setShowSaved(!showSaved)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs uppercase font-mono transition-all hover:bg-nasa-blue/30 ml-auto"
                        style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                      >
                        {showSaved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Saved ({savedQueries.length})
                      </button>
                    </div>
                  </div>

                  {/* Saved Queries Panel */}
                  <AnimatePresence>
                    {showSaved && savedQueries.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded p-3 space-y-2" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                          <p className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Saved Queries</p>
                          {savedQueries.map((sq) => (
                            <div key={sq.id} className="flex items-center gap-2 group">
                              <button
                                onClick={() => { setDbSQL(sq.queryText); setShowSaved(false); }}
                                className="flex-1 text-left px-2 py-1 rounded text-xs font-mono transition-all hover:bg-nasa-blue/20 truncate"
                                style={{ color: "var(--accent-light)" }}
                                title={sq.queryText}
                              >
                                {sq.name}
                              </button>
                              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                                {new Date(sq.createdAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => handleDeleteSavedQuery(sq.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-0.5"
                                title="Delete"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error display */}
                  {dbError && (
                    <div className="rounded p-3 text-xs font-mono" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171" }}>
                      {dbError}
                    </div>
                  )}

                  {/* Results table */}
                  {dbResult && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                          {dbResult.rowCount} row{dbResult.rowCount !== 1 ? "s" : ""} returned
                          {dbResult.truncated && <span className="text-yellow-400 ml-2">(showing first 500)</span>}
                        </p>
                        <button
                          onClick={() => {
                            const csv = [dbResult.columns.join(","), ...dbResult.rows.map(r => dbResult.columns.map(c => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
                            navigator.clipboard.writeText(csv);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-mono transition-all hover:bg-nasa-blue/30"
                          style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}
                        >
                          <Copy size={10} /> Copy CSV
                        </button>
                      </div>

                      <div className="overflow-auto rounded" style={{ maxHeight: "400px", border: "1px solid var(--border-color)" }}>
                        <table className="w-full text-xs font-mono" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-tertiary)", position: "sticky", top: 0 }}>
                              {dbResult.columns.map((col) => (
                                <th key={col} className="px-2 py-1.5 text-left whitespace-nowrap" style={{ color: "var(--accent-light)", borderBottom: "1px solid var(--border-color)" }}>
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dbResult.rows.map((row, i) => (
                              <tr key={i} className="hover:bg-nasa-blue/10 transition-colors" style={{ borderBottom: "1px solid var(--border-color)" }}>
                                {dbResult.columns.map((col) => (
                                  <td key={col} className="px-2 py-1 whitespace-nowrap max-w-[300px] truncate" style={{ color: "var(--text-primary)" }} title={String(row[col] ?? "")}>
                                    {row[col] === null ? <span style={{ color: "var(--text-muted)" }}>NULL</span> : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Quick queries */}
                  <div className="rounded p-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}>
                    <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Quick Queries</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "All Tables", sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename" },
                        { label: "Users", sql: "SELECT id, username, display_name, role, email, suspended, created_at FROM users ORDER BY created_at DESC" },
                        { label: "Sessions", sql: "SELECT id, user_id, expires, last_active_at, is_remembered FROM sessions ORDER BY last_active_at DESC LIMIT 20" },
                        { label: "Modules", sql: "SELECT id, title, slug, format, \"order\", visible, created_at FROM modules ORDER BY \"order\" ASC" },
                        { label: "Row Counts", sql: "SELECT relname AS table_name, n_live_tup AS row_count FROM pg_stat_user_tables ORDER BY n_live_tup DESC" },
                        { label: "DB Size", sql: "SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size" },
                        { label: "Table Sizes", sql: "SELECT relname AS table_name, pg_size_pretty(pg_total_relation_size(relid)) AS total_size FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC" },
                        { label: "Audit Logs", sql: "SELECT id, action, username, user_role, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20" },
                        { label: "Activity Logs", sql: "SELECT id, actor_id, action_type, target_id, created_at FROM system_activity_logs ORDER BY created_at DESC LIMIT 20" },
                      ].map(({ label, sql }) => (
                        <button
                          key={label}
                          onClick={() => setDbSQL(sql)}
                          className="px-2 py-1 rounded text-[10px] uppercase font-mono transition-all hover:bg-nasa-blue/30"
                          style={{ border: "1px solid var(--border-color)", color: "var(--accent-light)" }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
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
