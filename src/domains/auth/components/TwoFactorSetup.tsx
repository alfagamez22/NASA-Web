"use client";

import { useState, useEffect } from "react";
import { Shield, Copy, Check, AlertTriangle } from "lucide-react";

export default function TwoFactorSetup() {
  const [status, setStatus] = useState<{ enabled: boolean; hasSecret: boolean } | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; backupCodes: string[]; otpauthUri: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "setup" | "confirm" | "done">("idle");

  useEffect(() => {
    fetch("/api/auth/two-factor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status" }),
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
        setStep("setup");
      }
    } catch {} finally { setIsLoading(false); }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable" }),
      });
      if (res.ok) {
        setStatus({ enabled: true, hasSecret: true });
        setStep("done");
      }
    } catch {} finally { setIsLoading(false); }
  };

  const handleDisable = async () => {
    if (!confirm("Disable two-factor authentication? This will remove your TOTP secret.")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      if (res.ok) {
        setStatus({ enabled: false, hasSecret: false });
        setSetupData(null);
        setStep("idle");
      }
    } catch {} finally { setIsLoading(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!status) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={18} style={{ color: "var(--accent-color)" }} />
        <h4 className="font-display text-lg uppercase" style={{ color: "var(--accent-color)" }}>
          Two-Factor Authentication
        </h4>
        {status.enabled && (
          <span className="px-2 py-0.5 text-[10px] uppercase font-mono rounded bg-green-500/20 text-green-400">
            Enabled
          </span>
        )}
      </div>

      <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
        {status.enabled
          ? "2FA is active on your account. TOTP verification at login will be enforced in a future update."
          : "Add an extra layer of security by enabling TOTP-based two-factor authentication."}
      </p>

      {/* Scaffolding notice */}
      <div className="flex items-start gap-2 p-3 rounded border border-amber-500/30 bg-amber-500/5">
        <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[11px] font-mono text-amber-400">
          2FA scaffold: Secret generation and backup codes are functional. Login-time TOTP verification will be added in a future update.
        </p>
      </div>

      {step === "idle" && !status.enabled && (
        <button
          onClick={handleSetup}
          disabled={isLoading}
          className="px-4 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
          style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)", opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? "Setting up..." : "Set Up 2FA"}
        </button>
      )}

      {step === "setup" && setupData && (
        <div className="space-y-4">
          {/* Secret key */}
          <div className="p-3 rounded border border-[var(--border-color)]" style={{ background: "var(--bg-tertiary)" }}>
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
              Secret Key (enter in your authenticator app)
            </p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm tracking-widest" style={{ color: "var(--accent-light)" }}>
                {setupData.secret.match(/.{1,4}/g)?.join(" ")}
              </code>
              <button
                onClick={() => copyToClipboard(setupData.secret)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Copy secret"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} style={{ color: "var(--text-secondary)" }} />}
              </button>
            </div>
          </div>

          {/* OTP Auth URI for QR code */}
          <div className="p-3 rounded border border-[var(--border-color)]" style={{ background: "var(--bg-tertiary)" }}>
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: "var(--text-secondary)" }}>
              OTP Auth URI (for QR generation)
            </p>
            <code className="font-mono text-[11px] break-all" style={{ color: "var(--text-secondary)" }}>
              {setupData.otpauthUri}
            </code>
          </div>

          {/* Backup codes */}
          <div className="p-3 rounded border border-[var(--border-color)]" style={{ background: "var(--bg-tertiary)" }}>
            <p className="font-mono text-[10px] uppercase mb-2" style={{ color: "var(--text-secondary)" }}>
              Backup Codes (save these securely)
            </p>
            <div className="grid grid-cols-2 gap-1">
              {setupData.backupCodes.map((code, i) => (
                <code key={i} className="font-mono text-sm text-center py-0.5" style={{ color: "var(--text-primary)" }}>
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(setupData.backupCodes.join("\n"))}
              className="mt-2 flex items-center gap-1 text-[10px] font-mono uppercase"
              style={{ color: "var(--accent-color)" }}
            >
              <Copy size={10} /> Copy All
            </button>
          </div>

          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="px-4 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
            style={{ border: "1px solid #22c55e", color: "#22c55e", opacity: isLoading ? 0.5 : 1 }}
          >
            {isLoading ? "Enabling..." : "I've saved my codes — Enable 2FA"}
          </button>
        </div>
      )}

      {(step === "done" || status.enabled) && (
        <button
          onClick={handleDisable}
          disabled={isLoading}
          className="px-4 py-2 rounded text-xs uppercase font-mono transition-all hover:scale-105"
          style={{ border: "1px solid #ef4444", color: "#ef4444", opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? "Disabling..." : "Disable 2FA"}
        </button>
      )}
    </div>
  );
}
