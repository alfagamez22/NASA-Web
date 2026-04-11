"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/shared/contexts/auth-context";
import { EditModeProvider } from "@/shared/contexts/edit-mode-context";
import { PendingChangesProvider } from "@/shared/contexts/pending-context";
import { HighlightProvider } from "@/shared/contexts/highlight-context";
import AuthGate from "@/domains/auth/components/AuthGate";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <AuthGate>
          <EditModeProvider>
            <PendingChangesProvider>
              <HighlightProvider>
                {children}
              </HighlightProvider>
            </PendingChangesProvider>
          </EditModeProvider>
        </AuthGate>
      </AuthProvider>
    </SessionProvider>
  );
}
