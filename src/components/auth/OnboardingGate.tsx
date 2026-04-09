"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSession } from "next-auth/react";

type OnboardingStep = "email" | "otp" | "password" | "done";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, requiresOnboarding, refreshUser } = useAuth();
  const { update } = useSession();

  const [step, setStep] = useState<OnboardingStep>(() => {
    if (!user) return "done";
    if (!user.emailVerified) return user.userEmail ? "otp" : "email";
    if (!user.passwordChangedAfterCreation) return "password";
    return "done";
  });

  const [email, setEmail] = useState(user?.userEmail ?? "");
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (!requiresOnboarding || step === "done") return <>{children}</>;

  const sendOtp = async () => {
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email, tokenType: "email_verification" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpSent(true);
      setStep("otp");
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code: otp, tokenType: "email_verification" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      // Refresh session to get updated emailVerified
      await update();
      if (user && !user.passwordChangedAfterCreation) {
        setStep("password");
      } else {
        setStep("done");
        refreshUser();
      }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const changePassword = async () => {
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await update();
      setStep("done");
      refreshUser();
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const stepTitles: Record<OnboardingStep, string> = {
    email: "Set Up Your Email",
    otp: "Verify Your Email",
    password: "Change Your Password",
    done: "",
  };

  const stepDescriptions: Record<OnboardingStep, string> = {
    email: "A verified email is required for account recovery and security notifications.",
    otp: `Enter the 6-digit code sent to ${email}`,
    password: "For security, you must change your initial password before proceeding.",
    done: "",
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #0a1428 0%, #050a15 70%, #020408 100%)" }}
    >
      <div className="w-full max-w-md mx-4">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(["email", "otp", "password"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                style={{
                  background: step === s ? "var(--accent-color)" : (i < ["email", "otp", "password"].indexOf(step)) ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.05)",
                  color: step === s ? "#000" : "var(--text-secondary)",
                  border: step === s ? "none" : "1px solid var(--border-color)",
                }}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px" style={{ background: "var(--border-color)" }} />}
            </div>
          ))}
        </div>

        <div
          className="p-8 space-y-6"
          style={{
            background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(10, 20, 40, 0.95) 100%)",
            border: "1px solid var(--border-color-strong)",
            boxShadow: "0 0 40px rgba(0, 212, 255, 0.05)",
          }}
        >
          <div>
            <h2 className="font-display text-2xl tracking-tighter" style={{ color: "var(--text-primary)" }}>
              {stepTitles[step]}
            </h2>
            <p className="font-mono text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
              {stepDescriptions[step]}
            </p>
          </div>

          {step === "email" && (
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full p-3 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent-color)]"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                autoFocus
              />
              {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
              <button onClick={sendOtp} disabled={loading} className="nasa-btn w-full text-center disabled:opacity-50">
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full p-3 font-mono text-lg bg-transparent outline-none text-center tracking-[0.5em] focus:border-[var(--accent-color)]"
                style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                maxLength={6}
                autoFocus
              />
              {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
              <button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="nasa-btn w-full text-center disabled:opacity-50">
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                onClick={() => { setOtp(""); sendOtp(); }}
                disabled={loading}
                className="w-full text-center font-mono text-xs hover:underline disabled:opacity-50"
                style={{ color: "var(--accent-color)" }}
              >
                Resend code
              </button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full p-3 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent-color)]"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                  autoFocus
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
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs tracking-wider" style={{ color: "var(--text-secondary)" }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-3 font-mono text-sm bg-transparent outline-none focus:border-[var(--accent-color)]"
                  style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                />
              </div>
              {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
              <button onClick={changePassword} disabled={loading} className="nasa-btn w-full text-center disabled:opacity-50">
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
