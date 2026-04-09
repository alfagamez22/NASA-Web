"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export type UserRole = "super_admin" | "admin" | "editor" | "viewer";

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  userEmail: string | null;
  emailVerified: boolean;
  passwordChangedAfterCreation: boolean;
  createdBy: string | null;
}

/** Onboarding is required when email isn't verified, or when an admin-created account hasn't changed its password. */
export function needsOnboarding(user: UserAccount | null): boolean {
  if (!user) return false;
  // Email must always be verified
  if (!user.emailVerified) return true;
  // Password change only required for admin-created accounts
  if (!user.passwordChangedAfterCreation && user.createdBy) return true;
  return false;
}

interface AuthContextType {
  user: UserAccount | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => void;
  canAccessPage: (pageSlug: string) => boolean;
  requiresOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [loginError, setLoginError] = useState<string | null>(null);

  const user: UserAccount | null = session?.user
    ? {
        id: session.user.id!,
        username: (session.user as { username?: string }).username ?? session.user.email ?? "",
        displayName: session.user.name ?? "",
        role: ((session.user as { role?: string }).role ?? "viewer") as UserRole,
        userEmail: (session.user as { userEmail?: string | null }).userEmail ?? null,
        emailVerified: (session.user as { emailVerified?: boolean }).emailVerified ?? false,
        passwordChangedAfterCreation: (session.user as { passwordChangedAfterCreation?: boolean }).passwordChangedAfterCreation ?? false,
        createdBy: (session.user as { createdBy?: string | null }).createdBy ?? null,
      }
    : null;

  const login = useCallback(async (username: string, password: string, rememberMe = false): Promise<string | null> => {
    const result = await signIn("credentials", {
      username,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (result?.error) {
      return "Invalid username or password";
    }
    // Audit: record login (fire-and-forget; session not ready yet, so pass username)
    fetch("/api/audit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", userId: "_pending", username, userRole: "_pending" }),
    }).catch(() => {});
    return null;
  }, []);

  const logout = useCallback(() => {
    // Audit: record logout before signing out
    if (user) {
      fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", userId: user.id, username: user.username, userRole: user.role }),
      }).catch(() => {});
    }
    signOut({ redirect: false });
  }, [user]);

  const refreshUser = useCallback(() => {
    update();
  }, [update]);

  const canAccessPage = useCallback(
    (pageSlug: string): boolean => {
      if (!user) return false;
      if (user.role !== "viewer") return true;
      // Viewer permissions can be checked via API if needed
      return true;
    },
    [user]
  );

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const isEditor = user?.role === "editor";
  const isViewer = user?.role === "viewer";
  const isLoggedIn = !!user;
  const loading = status === "loading";
  const requiresOnboarding = needsOnboarding(user);

  const value: AuthContextType = {
    user, isAdmin, isSuperAdmin, isEditor, isViewer, isLoggedIn, loading,
    login, logout, refreshUser, canAccessPage, requiresOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
