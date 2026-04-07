"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Bell, Check, ArrowUpDown, ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: string;
  page: string;
  changeType: string;
  itemName: string;
  username: string;
  userId: string;
  read: boolean;
  createdAt: string;
}

interface PendingChange {
  id: string;
  page: string;
  changeType: string;
  itemName: string;
  status: "pending" | "approved" | "declined";
  entityRef: string | null;
  snapshot: unknown;
  reason: string | null;
  userId: string;
  username: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ActivityLogEntry {
  id: string;
  page: string;
  changeType: string;
  itemName: string;
  username: string;
  userId: string;
  status: string;
  createdAt: string;
}

interface DBUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt?: string;
}

interface AdminSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_PAGES = [
  { slug: "home", label: "HOME" },
  { slug: "know-more", label: "KNOW MORE" },
  { slug: "report", label: "RAN REPORT" },
  { slug: "report-2g", label: "2G REPORT" },
  { slug: "report-3g", label: "3G REPORT" },
  { slug: "report-lte", label: "LTE REPORT" },
  { slug: "team", label: "TEAM" },
  { slug: "team-drive", label: "TEAM DRIVE" },
  { slug: "inside-vortex", label: "INSIDE VORTEX" },
];

export default function AdminSettingsPanel({ isOpen, onClose }: AdminSettingsPanelProps) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"account" | "users" | "notifications" | "logs">("users");
  const [users, setUsersState] = useState<DBUser[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [permUserId, setPermUserId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Form state
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formRole, setFormRole] = useState<"editor" | "viewer">("viewer");

  // Admin account form
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  // Viewer permissions
  const [permPages, setPermPages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  async function refreshList() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsersState(await res.json());
    } catch { /* ignore */ }
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotificationsState(await res.json());
    } catch { /* ignore */ }
    try {
      const res = await fetch("/api/pending-changes?status=pending");
      if (res.ok) setPendingChanges(await res.json());
    } catch { /* ignore */ }
    try {
      const res = await fetch("/api/activity-log");
      if (res.ok) setActivityLogs(await res.json());
    } catch { /* ignore */ }
  }

  function resetForm() {
    setFormUsername("");
    setFormPassword("");
    setFormDisplayName("");
    setFormRole("viewer");
    setEditingUser(null);
    setIsCreating(false);
  }

  async function handleCreateUser() {
    if (!formUsername || !formPassword || !formDisplayName) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUsername, password: formPassword, displayName: formDisplayName, role: formRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create user");
        return;
      }
    } catch { alert("Network error"); return; }
    resetForm();
    refreshList();
  }

  async function handleUpdateUser() {
    if (!editingUser) return;
    const body: Record<string, string> = { id: editingUser.id, role: formRole };
    if (formDisplayName) body.displayName = formDisplayName;
    if (formPassword) body.password = formPassword;
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch { /* ignore */ }
    resetForm();
    refreshList();
  }

  async function handleDeleteUser(id: string) {
    if (confirm("Delete this user?")) {
      try {
        await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      } catch { /* ignore */ }
      refreshList();
    }
  }

  async function handleToggleRole(u: DBUser) {
    const newRole = u.role === "editor" ? "viewer" : "editor";
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, role: newRole }),
      });
    } catch { /* ignore */ }
    refreshList();
  }

  function startEdit(u: DBUser) {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword("");
    setFormDisplayName(u.displayName);
    setFormRole(u.role as "editor" | "viewer");
    setIsCreating(false);
  }

  async function openPermissions(userId: string) {
    setPermUserId(userId);
    try {
      const res = await fetch(`/api/permissions?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPermPages(data.allowedPages?.length ? data.allowedPages : ALL_PAGES.map((p) => p.slug));
      } else {
        setPermPages(ALL_PAGES.map((p) => p.slug));
      }
    } catch {
      setPermPages(ALL_PAGES.map((p) => p.slug));
    }
  }

  async function savePermissions() {
    if (permUserId) {
      await fetch("/api/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: permUserId, allowedPages: permPages }),
      });
      setPermUserId(null);
    }
  }

  function togglePermPage(slug: string) {
    setPermPages((prev) => (prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]));
  }

  async function handleUpdateAdmin() {
    if (!user) return;
    const body: Record<string, string> = { id: user.id };
    if (adminPassword) body.password = adminPassword;
    try {
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch { /* ignore */ }
    refreshUser();
    setAdminMsg("Admin credentials updated.");
    setAdminUsername("");
    setAdminPassword("");
    setTimeout(() => setAdminMsg(""), 3000);
  }

  if (!isOpen) return null;

  const nonAdminUsers = users.filter((u) => u.role !== "admin");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingCount = pendingChanges.length;

  const pageLabel = (slug: string) => ALL_PAGES.find((p) => p.slug === slug)?.label || slug.toUpperCase();

  async function handleApprove(id: string) {
    try {
      await fetch("/api/pending-changes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
    } catch { /* ignore */ }
    refreshList();
  }

  async function handleDecline(id: string, reason?: string) {
    try {
      await fetch("/api/pending-changes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "decline", reason: reason || undefined }),
      });
    } catch { /* ignore */ }
    setDeclineId(null);
    setDeclineReason("");
    refreshList();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div
        className="w-full max-w-xl overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
          borderLeft: "2px solid var(--border-color-strong)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6" style={{ background: "var(--bg-secondary)", borderBottom: "2px solid var(--border-color)" }}>
          <h2 className="font-display text-3xl uppercase" style={{ color: "var(--accent-color)" }}>
            ADMIN SETTINGS
          </h2>
          <button onClick={onClose} className="text-nasa-gray hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid var(--border-color)" }}>
          {(["account", "users", "notifications", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${activeTab === tab ? "" : "text-nasa-gray hover:text-white"}`}
              style={{
                color: activeTab === tab ? "var(--accent-color)" : undefined,
                borderBottom: activeTab === tab ? "2px solid var(--accent-color)" : "2px solid transparent",
                background: activeTab === tab ? "var(--bg-tertiary)" : "transparent",
              }}
            >
              <span className="flex items-center justify-center gap-1">
                {tab}
                {tab === "notifications" && unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                {tab === "notifications" && pendingCount > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* ── Account Tab ──────────────────────────────────────────── */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <h3 className="font-display text-xl uppercase" style={{ color: "var(--accent-color)" }}>
                CHANGE ADMIN CREDENTIALS
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>New Username</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder={user?.username}
                    className="w-full p-2 mt-1 font-mono text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>New Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2 mt-1 font-mono text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  />
                </div>
                <button onClick={handleUpdateAdmin} className="nasa-btn text-sm">UPDATE</button>
                {adminMsg && <p className="font-mono text-xs text-green-400">{adminMsg}</p>}
              </div>
            </div>
          )}

          {/* ── Users Tab ────────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl uppercase" style={{ color: "var(--accent-color)" }}>
                  USER ACCOUNTS
                </h3>
                <button
                  onClick={() => { resetForm(); setIsCreating(true); }}
                  className="nasa-btn text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> ADD USER
                </button>
              </div>

              {/* Create / Edit Form */}
              {(isCreating || editingUser) && (
                <div className="p-4 space-y-3" style={{ border: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  <h4 className="font-mono text-xs uppercase" style={{ color: "var(--accent-color)" }}>
                    {isCreating ? "CREATE NEW USER" : `EDITING: ${editingUser?.displayName}`}
                  </h4>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="Display Name"
                    className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={isCreating ? "Password" : "New Password (leave blank to keep)"}
                    className="w-full p-2 font-mono text-sm bg-transparent outline-none"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  />
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as "editor" | "viewer")}
                    className="w-full p-2 font-mono text-sm bg-transparent outline-none cursor-pointer"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)", background: "var(--bg-primary)" }}
                  >
                    <option value="viewer">VIEWER</option>
                    <option value="editor">EDITOR</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={isCreating ? handleCreateUser : handleUpdateUser} className="nasa-btn text-xs">
                      {isCreating ? "CREATE" : "SAVE"}
                    </button>
                    <button onClick={resetForm} className="nasa-btn text-xs" style={{ color: "var(--text-secondary)" }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              {/* Permissions Editor */}
              {permUserId && (
                <div className="p-4 space-y-3" style={{ border: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
                  <h4 className="font-mono text-xs uppercase" style={{ color: "var(--accent-color)" }}>
                    PAGE PERMISSIONS
                  </h4>
                  <div className="space-y-2">
                    {ALL_PAGES.map((page) => (
                      <label key={page.slug} className="flex items-center gap-2 cursor-pointer font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                        <input
                          type="checkbox"
                          checked={permPages.includes(page.slug)}
                          onChange={() => togglePermPage(page.slug)}
                          className="accent-cyan-400"
                        />
                        {page.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={savePermissions} className="nasa-btn text-xs">SAVE PERMISSIONS</button>
                    <button onClick={() => setPermUserId(null)} className="nasa-btn text-xs" style={{ color: "var(--text-secondary)" }}>CANCEL</button>
                  </div>
                </div>
              )}

              {/* User List */}
              <div className="space-y-2">
                {nonAdminUsers.length === 0 && (
                  <p className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
                    No users created yet.
                  </p>
                )}
                {nonAdminUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3" style={{ border: "1px solid var(--border-color)" }}>
                    <div>
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {u.displayName}
                      </span>
                      <span className="font-mono text-xs ml-2" style={{ color: "var(--text-secondary)" }}>
                        @{u.username}
                      </span>
                      <span
                        className="font-mono text-[10px] ml-2 px-2 py-0.5 uppercase"
                        style={{
                          border: "1px solid",
                          borderColor: u.role === "editor" ? "rgba(0,212,255,0.5)" : "rgba(255,191,0,0.4)",
                          color: u.role === "editor" ? "#00d4ff" : "#ffc107",
                        }}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleRole(u)} className="p-1.5 text-nasa-gray hover:text-white transition-colors" title="Toggle Role">
                        <ArrowUpDown size={14} />
                      </button>
                      {u.role === "viewer" && (
                        <button onClick={() => openPermissions(u.id)} className="p-1.5 text-nasa-gray hover:text-white transition-colors" title="Page Permissions">
                          <ChevronDown size={14} />
                        </button>
                      )}
                      <button onClick={() => startEdit(u)} className="p-1.5 text-nasa-gray hover:text-white transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-nasa-gray hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Notifications Tab ─────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              {/* Pending Changes Section */}
              {pendingCount > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-xl uppercase flex items-center gap-2" style={{ color: "var(--accent-color)" }}>
                    <Clock size={18} /> PENDING REQUESTS
                    <span className="bg-amber-500/20 text-amber-400 text-xs font-mono px-2 py-0.5 rounded-full">{pendingCount}</span>
                  </h3>
                  <div className="space-y-2">
                    {pendingChanges.map((pc) => (
                      <div
                        key={pc.id}
                        className="p-3"
                        style={{
                          border: "1px solid rgba(245,158,11,0.4)",
                          background: "rgba(245,158,11,0.05)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-sm font-bold" style={{ color: "var(--accent-color)" }}>
                              [{pc.changeType.toUpperCase()}] {pc.itemName}
                            </span>
                            <p className="font-mono text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                              Page: {pageLabel(pc.page)} &bull; By: {pc.username}
                            </p>
                            <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {new Date(pc.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {declineId === pc.id ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="p-1 font-mono text-xs bg-transparent outline-none w-40"
                                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDecline(pc.id, declineReason)}
                                  className="flex-1 py-1 px-2 font-mono text-[10px] uppercase bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                                >
                                  CONFIRM
                                </button>
                                <button
                                  onClick={() => { setDeclineId(null); setDeclineReason(""); }}
                                  className="py-1 px-2 font-mono text-[10px] uppercase text-nasa-gray hover:text-white transition-colors"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleApprove(pc.id)}
                                className="p-1.5 text-green-400 hover:bg-green-500/20 transition-colors rounded"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => setDeclineId(pc.id)}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 transition-colors rounded"
                                title="Decline"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl uppercase flex items-center gap-2" style={{ color: "var(--accent-color)" }}>
                    <Bell size={18} /> NOTIFICATIONS
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => { await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllRead: true }) }); refreshList(); }}
                      className="nasa-btn text-[10px] flex items-center gap-1"
                    >
                      <Check size={12} /> MARK ALL READ
                    </button>
                    <button
                      onClick={async () => { await fetch('/api/notifications', { method: 'DELETE' }); refreshList(); }}
                      className="nasa-btn text-[10px] flex items-center gap-1"
                    >
                      <Trash2 size={12} /> CLEAR
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {notifications.length === 0 && pendingCount === 0 && (
                    <p className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
                      No notifications.
                    </p>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 cursor-pointer transition-colors"
                      style={{
                        border: "1px solid var(--border-color)",
                        background: n.read ? "transparent" : "rgba(0,212,255,0.05)",
                      }}
                      onClick={async () => { await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) }); refreshList(); }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-sm font-bold" style={{ color: n.read ? "var(--text-secondary)" : "var(--accent-color)" }}>
                            [{n.changeType.toUpperCase()}] {n.itemName}
                          </span>
                          <p className="font-mono text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                            Page: {pageLabel(n.page)} &bull; By: {n.username}
                          </p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 flex-shrink-0" />}
                      </div>
                      <p className="font-mono text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Activity Logs Tab ─────────────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <h3 className="font-display text-xl uppercase flex items-center gap-2" style={{ color: "var(--accent-color)" }}>
                <ClipboardList size={18} /> ACTIVITY LOG
              </h3>
              <div className="space-y-2">
                {activityLogs.length === 0 && (
                  <p className="font-mono text-xs uppercase" style={{ color: "var(--text-secondary)" }}>
                    No activity yet.
                  </p>
                )}
                {activityLogs.map((log) => {
                  const statusColor =
                    log.status === "approved" ? "text-green-400" :
                    log.status === "declined" ? "text-red-400" :
                    log.status === "applied" ? "text-cyan-400" :
                    "text-amber-400";
                  const statusBorder =
                    log.status === "approved" ? "rgba(34,197,94,0.3)" :
                    log.status === "declined" ? "rgba(239,68,68,0.3)" :
                    log.status === "applied" ? "rgba(0,212,255,0.3)" :
                    "rgba(245,158,11,0.3)";
                  return (
                    <div
                      key={log.id}
                      className="p-3"
                      style={{ border: `1px solid ${statusBorder}` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            [{log.changeType.toUpperCase()}] {log.itemName}
                          </span>
                          <p className="font-mono text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                            Page: {pageLabel(log.page)} &bull; By: {log.username}
                          </p>
                        </div>
                        <span className={`font-mono text-[10px] uppercase px-2 py-0.5 flex-shrink-0 ${statusColor}`} style={{ border: `1px solid ${statusBorder}` }}>
                          {log.status}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
