import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username: string;
      userEmail: string | null;
      emailVerified: boolean;
      passwordChangedAfterCreation: boolean;
      createdBy: string | null;
    } & Omit<NonNullable<DefaultSession["user"]>, "emailVerified">;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string;
    userEmail?: string | null;
    emailVerified?: boolean;
    passwordChangedAfterCreation?: boolean;
    createdBy?: string | null;
  }
}
