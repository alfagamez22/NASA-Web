"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Step = "username" | "code" | "newPassword" | "success";

export default function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", username }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMessage(data.message);
      setStep("code");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", username, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep("success");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 p-8 space-y-6"
        style={{
          background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(10, 20, 40, 0.95) 100%)",
          border: "1px solid var(--border-color-strong)",
        }}
      >
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "var(--text-secondary)" }}>
          <X size={18} />
        </button>

        <h2 className="font-display text-2xl tracking-tighter" style={{ color: "var(--text-primary)" }}>
          Reset Password
        </h2>

        {step === "username" && (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
              Enter your username. If the account has a verified email, a reset code will be sent.
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-3 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent-color)]"
              style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              autoFocus
              required
            />
            {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
            <button type="submit" disabled={loading} className="nasa-btn w-full text-center disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleReset} className="space-y-4">
            {message && <p className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{message}</p>}
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full p-3 font-mono text-sm bg-transparent outline-none text-center tracking-[0.5em] focus:border-[var(--accent-color)]"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full p-3 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent-color)]"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-3 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent-color)]"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                required
              />
            </div>
            {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
            <button type="submit" disabled={loading} className="nasa-btn w-full text-center disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <p className="font-mono text-sm" style={{ color: "var(--accent-color)" }}>
              Password reset successfully!
            </p>
            <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
              You can now sign in with your new password.
            </p>
            <button onClick={onClose} className="nasa-btn w-full text-center">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
