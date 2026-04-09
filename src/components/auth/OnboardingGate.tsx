"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSession } from "next-auth/react";

type OnboardingStep = "email" | "otp" | "password" | "done";

/** Mask email: j***@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 1 ? local : local[0] + "***";
  return `${masked}@${domain}`;
}

/** Password complexity checks */
function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("1 uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("1 number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 special character");
  return errors;
}

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, requiresOnboarding, refreshUser, logout } = useAuth();
  const { update } = useSession();

  const needsPasswordChange = !!user?.createdBy && !user?.passwordChangedAfterCreation;
  const visibleSteps: readonly OnboardingStep[] = needsPasswordChange
    ? ["email", "otp", "password"]
    : ["email", "otp"];

  const [step, setStep] = useState<OnboardingStep>(() => {
    if (!user) return "done";
    if (!user.emailVerified) return user.userEmail ? "otp" : "email";
    if (needsPasswordChange) return "password";
    return "done";
  });

  const [email, setEmail] = useState(user?.userEmail ?? "");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // 60-second resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // OTP box handlers
  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const digits = paste.split("");
    setOtpDigits((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      return next;
    });
    const focusIndex = Math.min(digits.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }, []);

  const otpCode = otpDigits.join("");

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
      setResendTimer(60);
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
        body: JSON.stringify({ action: "verify", email, code: otpCode, tokenType: "email_verification" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await update();
      if (needsPasswordChange) {
        setStep("password");
      } else {
        setStep("done");
        refreshUser();
      }
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const changePassword = async () => {
    setError("");
    const complexityErrors = getPasswordErrors(newPassword);
    if (complexityErrors.length > 0) { setError("Password needs: " + complexityErrors.join(", ")); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
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
    otp: `Enter the 6-digit code sent to ${maskEmail(email)}`,
    password: "Your account was created by an administrator. Please set a personal password to continue.",
    done: "",
  };

  const passwordErrors = getPasswordErrors(newPassword);

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #0a1428 0%, #050a15 70%, #020408 100%)" }}
    >
      <div className="w-full max-w-md mx-4">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {visibleSteps.map((s, i) => {
            const stepIndex = visibleSteps.indexOf(step);
            const isActive = step === s;
            const isCompleted = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                  style={{
                    background: isActive ? "var(--accent-color)" : isCompleted ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.05)",
                    color: isActive ? "#000" : "var(--text-secondary)",
                    border: isActive ? "none" : "1px solid var(--border-color)",
                  }}
                >
                  {isCompleted ? "\u2713" : i + 1}
                </div>
                {i < visibleSteps.length - 1 && <div className="w-8 h-px" style={{ background: "var(--border-color)" }} />}
              </div>
            );
          })}
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
              {/* Legacy account notice */}
              {!user?.createdBy && (
                <div className="p-3 font-mono text-xs rounded" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", color: "var(--text-secondary)" }}>
                  We&apos;ve added email verification to keep your account secure. This is a one-time setup.
                </div>
              )}
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
              {/* 6-box OTP input */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    title={`Digit ${i + 1}`}
                    className="w-11 h-12 text-center font-mono text-lg bg-transparent outline-none focus:border-[var(--accent-color)]"
                    style={{ border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {error && <p className="font-mono text-xs text-red-400 bg-red-400/10 p-2 border border-red-400/20">{error}</p>}
              <button onClick={verifyOtp} disabled={loading || otpCode.length !== 6} className="nasa-btn w-full text-center disabled:opacity-50">
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button
                onClick={() => { setOtpDigits(["", "", "", "", "", ""]); sendOtp(); }}
                disabled={loading || resendTimer > 0}
                className="w-full text-center font-mono text-xs hover:underline disabled:opacity-50"
                style={{ color: resendTimer > 0 ? "var(--text-secondary)" : "var(--accent-color)" }}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
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
                {/* Live complexity indicators */}
                {newPassword.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { label: "8+ chars", ok: newPassword.length >= 8 },
                      { label: "Uppercase", ok: /[A-Z]/.test(newPassword) },
                      { label: "Number", ok: /[0-9]/.test(newPassword) },
                      { label: "Special", ok: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((r) => (
                      <span
                        key={r.label}
                        className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: r.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
                          color: r.ok ? "#22c55e" : "#ef4444",
                          border: `1px solid ${r.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        {r.ok ? "\u2713" : "\u2717"} {r.label}
                      </span>
                    ))}
                  </div>
                )}
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
              <button onClick={changePassword} disabled={loading || passwordErrors.length > 0} className="nasa-btn w-full text-center disabled:opacity-50">
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}
        </div>

        {/* Signed-in account & sign out link */}
        <div className="mt-6 text-center space-y-1">
          <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
            Signed in as <span style={{ color: "var(--text-primary)" }}>{user?.username}</span>
          </p>
          <button
            onClick={logout}
            className="font-mono text-xs hover:underline transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-color)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Sign out &amp; use a different account
          </button>
        </div>
      </div>
    </div>
  );
}
