"use client";

import { useAuth } from "@/lib/auth-context";
import LoginPage from "./LoginPage";
import OnboardingGate from "./OnboardingGate";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();

  // Show nothing while checking session (prevents flash of login page)
  if (loading) {
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
