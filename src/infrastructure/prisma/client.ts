import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // prisma+postgres:// URLs encode the real DB URL in an api_key JWT payload
  if (url.startsWith("prisma+postgres://")) {
    const parsed = new URL(url);
    const apiKey = parsed.searchParams.get("api_key");
    if (apiKey) {
      const payload = JSON.parse(Buffer.from(apiKey, "base64").toString());
      if (payload.databaseUrl) return payload.databaseUrl;
    }
  }

  return url;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getConnectionString() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
