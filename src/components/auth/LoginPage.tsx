"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const err = await login(username, password);
    if (err) {
      setError(err);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, #0a1428 0%, #050a15 70%, #020408 100%)",
      }}
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03] animate-pulse"
          style={{
            background: "radial-gradient(circle, var(--accent-color) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            <Image
              src="/broadcast.gif"
              alt="NASA Portal"
              width={64}
              height={64}
              unoptimized
              className="object-contain"
            />
          </div>
          <h1
            className="font-display text-5xl tracking-tighter"
            style={{ color: "var(--accent-color)", textShadow: "0 0 20px var(--glow-color)" }}
          >
            NASA
          </h1>
          <p className="font-mono text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            Network Access Service &amp; Assurance
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-8 space-y-6"
          style={{
            background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(10, 20, 40, 0.95) 100%)",
            border: "1px solid var(--border-color-strong)",
            boxShadow: "0 0 40px rgba(0, 212, 255, 0.05)",
          }}
        >
          <div>
            <h2
              className="font-display text-3xl tracking-tighter"
              style={{ color: "var(--text-primary)" }}
            >
              Sign in
            </h2>
            <p className="font-mono text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Authorized personnel only
            </p>
          </div>

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
                className="w-full p-3 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent-color)]"
                style={{
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
                autoFocus
                autoComplete="username"
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
                className="w-full p-3 font-mono text-sm bg-transparent outline-none transition-colors focus:border-[var(--accent-color)]"
                style={{
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="nasa-btn w-full text-center disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center font-mono text-[10px] mt-6" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>
          Confidential system — Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
