"use client";

import { useAuth } from "@/shared/contexts/auth-context";
import LoginPage from "./LoginPage";
import OnboardingGate from "./OnboardingGate";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading, user } = useAuth();

  // Show spinner only on the very first auth check (no previous user).
  // Do NOT show it during session refreshes (e.g. update() after OTP verify)
  // because that would unmount OnboardingGate and reset its step state.
  if (loading && !user) {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #0a1428 0%, #050a15 70%, #020408 100%)" }}
      >
        <div className="animate-pulse font-display text-3xl tracking-tighter" style={{ color: "var(--accent-color)" }}>
          NASA
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return <OnboardingGate>{children}</OnboardingGate>;
}
