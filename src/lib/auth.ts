import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 24 h default
  pages: {
    signIn: "/", // AuthGate handles the login UI
  },
  logger: {
    error: (code) => {
      // Suppress expected CredentialsSignin errors (wrong password)
      if (code instanceof Error && code.name === "CredentialsSignin") return;
      console.error("[auth]", code);
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user) return null;

        // ── Suspension check (F13) ───────────────────────────────────
        if (user.suspended) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) {
          // Track failed login attempts (F13 — auto-suspend after threshold)
          const attempts = user.failedLoginAttempts + 1;
          const updateData: Record<string, unknown> = {
            failedLoginAttempts: attempts,
            lastFailedLoginAt: new Date(),
          };
          // Auto-suspend after 10 consecutive failures
          if (attempts >= 10) {
            updateData.suspended = true;
            updateData.suspendedAt = new Date();
            updateData.suspendedReason = "Auto-suspended: exceeded 10 failed login attempts";
            updateData.suspendedManually = false;
          }
          await prisma.user.update({ where: { id: user.id }, data: updateData });
          return null;
        }

        // Reset failed attempts on success & update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastFailedLoginAt: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          name: user.displayName,
          email: user.username, // NextAuth requires email field, we use username
          role: user.role,
          userEmail: user.email,
          emailVerified: user.emailVerified,
          passwordChangedAfterCreation: user.passwordChangedAfterCreation,
          suspended: user.suspended,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.role = u.role as string;
        token.username = user.email; // email holds username
        token.userEmail = (u.userEmail as string) ?? null;
        token.emailVerified = (u.emailVerified as boolean) ?? false;
        token.passwordChangedAfterCreation = (u.passwordChangedAfterCreation as boolean) ?? false;
      }
      // Refresh user data from DB on session update
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({ where: { id: token.sub } });
        if (fresh) {
          token.role = fresh.role;
          token.username = fresh.username;
          token.userEmail = fresh.email;
          token.emailVerified = fresh.emailVerified;
          token.passwordChangedAfterCreation = fresh.passwordChangedAfterCreation;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).username = token.username;
        (session.user as Record<string, unknown>).userEmail = token.userEmail ?? null;
        (session.user as Record<string, unknown>).emailVerified = token.emailVerified ?? false;
        (session.user as Record<string, unknown>).passwordChangedAfterCreation = token.passwordChangedAfterCreation ?? false;
      }
      return session;
    },
  },
});
