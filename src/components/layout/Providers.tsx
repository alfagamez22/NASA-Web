"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { EditModeProvider } from "@/lib/edit-mode-context";
import AuthGate from "@/components/auth/AuthGate";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <EditModeProvider>
          <AuthGate>{children}</AuthGate>
        </EditModeProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
