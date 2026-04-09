import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const LOGIN_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const LOGIN_COOLDOWN_THRESHOLD = 10;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 3 * 24 * 60 * 60 }, // 72 h default
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

        // ── Manual suspension check (admin action only) ──────────────
        if (user.suspended && user.suspendedManually) return null;

        // ── 3-minute cooldown after 10 consecutive failed logins ─────
        if (
          user.failedLoginAttempts >= LOGIN_COOLDOWN_THRESHOLD &&
          user.lastFailedLoginAt &&
          Date.now() - user.lastFailedLoginAt.getTime() < LOGIN_COOLDOWN_MS
        ) {
          return null; // Client shows cooldown message based on server response
        }

        // If cooldown expired, reset the counter so they get a fresh start
        if (
          user.failedLoginAttempts >= LOGIN_COOLDOWN_THRESHOLD &&
          user.lastFailedLoginAt &&
          Date.now() - user.lastFailedLoginAt.getTime() >= LOGIN_COOLDOWN_MS
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lastFailedLoginAt: null },
          });
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) {
          // Track failed login attempts — no suspension, only cooldown
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lastFailedLoginAt: new Date(),
            },
          });
          return null;
        }

        // Reset failed attempts on success & update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastFailedLoginAt: null,
            lastLoginAt: new Date(),
            // Clear non-manual suspensions on successful login
            ...(user.suspended && !user.suspendedManually
              ? { suspended: false, suspendedAt: null, suspendedReason: null }
              : {}),
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
          createdBy: user.createdBy,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const authUser = user as typeof user & {
          role?: string;
          userEmail?: string | null;
          emailVerified?: boolean;
          passwordChangedAfterCreation?: boolean;
          createdBy?: string | null;
        };
        token.role = authUser.role;
        token.username = user.email ?? undefined; // email holds username
        token.userEmail = authUser.userEmail ?? null;
        token.emailVerified = authUser.emailVerified ?? false;
        token.passwordChangedAfterCreation = authUser.passwordChangedAfterCreation ?? false;
        token.createdBy = authUser.createdBy ?? null;
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
          token.createdBy = fresh.createdBy;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const appToken = token as typeof token & {
          role?: string;
          username?: string;
          userEmail?: string | null;
          emailVerified?: boolean;
          passwordChangedAfterCreation?: boolean;
          createdBy?: string | null;
        };
        const sessionUser = session.user as unknown as {
          id: string;
          role: string;
          username: string;
          userEmail: string | null;
          emailVerified: boolean;
          passwordChangedAfterCreation: boolean;
          createdBy: string | null;
          email?: string | null;
        };
        if (token.sub) sessionUser.id = token.sub;
        sessionUser.role = appToken.role ?? "viewer";
        sessionUser.username = appToken.username ?? sessionUser.email ?? "";
        sessionUser.userEmail = appToken.userEmail ?? null;
        sessionUser.emailVerified = appToken.emailVerified ?? false;
        sessionUser.passwordChangedAfterCreation = appToken.passwordChangedAfterCreation ?? false;
        sessionUser.createdBy = appToken.createdBy ?? null;
      }
      return session;
    },
  },
});
