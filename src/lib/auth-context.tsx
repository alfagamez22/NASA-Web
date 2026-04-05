"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export type UserRole = "admin" | "editor" | "viewer";

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserAccount | null;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => void;
  canAccessPage: (pageSlug: string) => boolean;
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
      }
    : null;

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      return "Invalid username or password";
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    signOut({ redirect: false });
  }, []);

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

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor";
  const isViewer = user?.role === "viewer";
  const isLoggedIn = !!user;
  const loading = status === "loading";

  const value: AuthContextType = {
    user, isAdmin, isEditor, isViewer, isLoggedIn, loading, login, logout, refreshUser, canAccessPage,
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
