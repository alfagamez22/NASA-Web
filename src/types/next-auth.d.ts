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
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string;
    userEmail?: string | null;
    emailVerified?: boolean;
    passwordChangedAfterCreation?: boolean;
  }
}
