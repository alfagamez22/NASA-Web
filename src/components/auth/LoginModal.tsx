"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = await login(username, password);
    if (err) {
      setError(err);
    } else {
      setUsername("");
      setPassword("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md p-8 space-y-6 relative"
        style={{
          background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(10, 20, 40, 0.95) 100%)",
          border: "2px solid var(--border-color-strong)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-nasa-gray hover:text-nasa-light-cyan transition-colors"
        >
          <X size={20} />
        </button>

        <h2
          className="font-display text-4xl uppercase tracking-tighter"
          style={{ color: "var(--accent-color)", textShadow: "0 0 10px var(--glow-color)" }}
        >
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-3 font-mono text-sm bg-transparent outline-none"
              style={{
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 font-mono text-sm bg-transparent outline-none"
              style={{
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
              required
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-400">{error}</p>
          )}

          <button type="submit" className="nasa-btn w-full text-center">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
